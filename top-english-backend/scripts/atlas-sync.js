/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @description Công cụ Export toàn bộ dữ liệu Local MongoDB (EJSON chuẩn giữ nguyên ObjectId/Date)
 *              và Import/Đồng bộ 1 lần lên MongoDB Atlas.
 *
 * Cách dùng (chạy từ thư mục gốc hoặc top-english-backend):
 *   1. Xuất toàn bộ dữ liệu local ra 1 file duy nhất:
 *      node top-english-backend/scripts/atlas-sync.js export
 *
 *   2. Đẩy thẳng từ Local MongoDB lên MongoDB Atlas (1 bước duy nhất):
 *      node top-english-backend/scripts/atlas-sync.js push --uri="mongodb+srv://..."
 *      (hoặc đặt biến môi trường ATLAS_URI rồi chạy: node top-english-backend/scripts/atlas-sync.js push)
 *
 *   3. Nạp từ file export (hoặc thư mục JSON export từ MongoDB Compass) lên Atlas:
 *      node top-english-backend/scripts/atlas-sync.js import --uri="mongodb+srv://..."
 *      node top-english-backend/scripts/atlas-sync.js import --dir="./my-compass-exports" --uri="mongodb+srv://..."
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const { EJSON } = mongoose.mongo.BSON;

const DEFAULT_LOCAL_URI =
  process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/top_english';
const DEFAULT_BACKUP_FILE = path.resolve(
  __dirname,
  '..',
  '..',
  'top-english-backup.ejson',
);

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const options = {};

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith('--')) continue;
    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      const key = arg.slice(2, eqIdx);
      options[key] = arg.slice(eqIdx + 1);
    } else {
      const key = arg.slice(2);
      const next = rest[i + 1];
      if (next && !next.startsWith('--')) {
        options[key] = next;
        i += 1;
      } else {
        options[key] = true;
      }
    }
  }

  return { command, options };
}

function resolveTargetUri(options) {
  const uri = options.uri || process.env.ATLAS_URI || '';
  if (!uri || typeof uri !== 'string') {
    throw new Error(
      'Thiếu chuỗi kết nối MongoDB Atlas. Truyền --uri="mongodb+srv://..." hoặc đặt biến môi trường ATLAS_URI.',
    );
  }
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    throw new Error(
      'Chuỗi đích đang trỏ về localhost. Vui lòng truyền chuỗi mongodb+srv:// của MongoDB Atlas.',
    );
  }
  return uri.trim();
}

async function readLocalDatabase(localUri) {
  const conn = await mongoose.createConnection(localUri).asPromise();
  try {
    const collections = await conn.db.listCollections().toArray();
    const payload = {};
    let totalDocs = 0;

    for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const docs = await conn.db.collection(col.name).find({}).toArray();
      if (docs.length === 0) continue;
      payload[col.name] = docs;
      totalDocs += docs.length;
    }

    return { payload, totalDocs };
  } finally {
    await conn.close();
  }
}

function readCompassDirectory(dirPath) {
  const absDir = path.resolve(dirPath);
  if (!fs.existsSync(absDir)) {
    throw new Error(`Không tìm thấy thư mục: ${absDir}`);
  }

  const files = fs
    .readdirSync(absDir)
    .filter((f) => f.toLowerCase().endsWith('.json'));
  if (files.length === 0) {
    throw new Error(`Thư mục ${absDir} không chứa file .json nào.`);
  }

  const payload = {};
  let totalDocs = 0;

  for (const file of files) {
    const rawText = fs.readFileSync(path.join(absDir, file), 'utf8').trim();
    if (!rawText) continue;

    // Hỗ trợ cả JSON array lẫn NDJSON (mỗi dòng 1 document của MongoDB Compass)
    const parsed = rawText.startsWith('[')
      ? EJSON.parse(rawText, { relaxed: false })
      : rawText
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => EJSON.parse(line, { relaxed: false }));

    if (!Array.isArray(parsed) || parsed.length === 0) continue;

    // Cho phép đặt tên dạng top_english.vocabularies.json hoặc vocabularies.json
    const baseName = file.replace(/\.json$/i, '');
    const colName = baseName.includes('.') ? baseName.split('.').pop() : baseName;
    payload[colName] = parsed;
    totalDocs += parsed.length;
  }

  return { payload, totalDocs };
}

async function writeToAtlas(atlasUri, payload) {
  const conn = await mongoose.createConnection(atlasUri).asPromise();
  try {
    const collectionNames = Object.keys(payload);
    console.log(`\n🔌 Đã kết nối MongoDB Atlas (${conn.name}). Bắt đầu đồng bộ ${collectionNames.length} bảng...`);

    for (const colName of collectionNames) {
      const docs = payload[colName];
      if (!Array.isArray(docs) || docs.length === 0) continue;

      const collection = conn.db.collection(colName);

      if (colName === 'users') {
        // Giữ lại tài khoản đăng ký ngoài (VD: Google Login trên web thật nếu có), đồng bộ các tài khoản từ bản xuất
        const localEmails = new Set(
          docs
            .map((u) => (typeof u.email === 'string' ? u.email.toLowerCase().trim() : ''))
            .filter(Boolean),
        );
        const existingAtlasUsers = await collection.find({}).toArray();
        const extraAtlasUsers = existingAtlasUsers.filter(
          (u) =>
            typeof u.email === 'string' &&
            !localEmails.has(u.email.toLowerCase().trim()),
        );

        await collection.deleteMany({});
        const normalizedLocalUsers = docs.map((u) => {
          const copy = { ...u };
          if (copy.googleId === null) delete copy.googleId;
          return copy;
        });
        const mergedUsers = [...normalizedLocalUsers, ...extraAtlasUsers];
        if (mergedUsers.length > 0) {
          await collection.insertMany(mergedUsers, { ordered: false });
        }
        console.log(
          `  ✅ ${colName}: ${normalizedLocalUsers.length} từ local` +
            (extraAtlasUsers.length > 0
              ? ` (+ giữ lại ${extraAtlasUsers.length} user chỉ có trên Atlas)`
              : ''),
        );
      } else {
        await collection.deleteMany({});
        await collection.insertMany(docs, { ordered: true });
        console.log(`  ✅ ${colName}: ${docs.length} documents`);
      }
    }
  } finally {
    await conn.close();
  }
}

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

function collectReferencedUploadFilenames(value, outSet) {
  if (!value) return;
  if (typeof value === 'string') {
    const match = value.match(/\/uploads\/([^/?#\s]+)/);
    if (match && match[1]) outSet.add(match[1]);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectReferencedUploadFilenames(item, outSet);
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value)) collectReferencedUploadFilenames(v, outSet);
  }
}

async function pushMediaToAtlas(atlasUri, uploadsDir, includeAll = false) {
  if (!fs.existsSync(uploadsDir)) {
    throw new Error(`Không tìm thấy thư mục uploads: ${uploadsDir}`);
  }

  const conn = await mongoose.createConnection(atlasUri).asPromise();
  try {
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads',
    });

    let targetFiles;
    if (includeAll) {
      targetFiles = fs
        .readdirSync(uploadsDir)
        .filter((f) => f !== '.gitkeep' && fs.statSync(path.join(uploadsDir, f)).size > 0);
    } else {
      const referenced = new Set();
      const settings = await conn.db.collection('system_settings').find({}).toArray();
      const users = await conn.db.collection('users').find({}).project({ avatar: 1 }).toArray();
      collectReferencedUploadFilenames(settings, referenced);
      collectReferencedUploadFilenames(users, referenced);
      targetFiles = [...referenced].filter((f) => {
        const full = path.join(uploadsDir, f);
        return fs.existsSync(full) && fs.statSync(full).size > 0;
      });
    }

    console.log(`\n🖼️  Tìm thấy ${targetFiles.length} ảnh cần đồng bộ lên MongoDB Atlas GridFS...`);
    let uploaded = 0;

    for (const filename of targetFiles) {
      const existing = await bucket.find({ filename }).limit(1).toArray();
      if (existing.length > 0) {
        console.log(`  ⏭️  ${filename} (đã có trên Atlas)`);
        continue;
      }

      const fullPath = path.join(uploadsDir, filename);
      const ext = path.extname(filename).toLowerCase();
      const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';

      await new Promise((resolvePromise, rejectPromise) => {
        const upStream = bucket.openUploadStream(filename, {
          metadata: { contentType, originalName: filename },
        });
        fs.createReadStream(fullPath)
          .pipe(upStream)
          .on('error', rejectPromise)
          .on('finish', resolvePromise);
      });

      uploaded += 1;
      console.log(`  ✅ Đã tải lên GridFS: ${filename}`);
    }

    console.log(`\n🎉 Đã đồng bộ xong ${uploaded} ảnh mới lên Atlas GridFS!`);
  } finally {
    await conn.close();
  }
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const localUri = options.local || DEFAULT_LOCAL_URI;
  const backupFile = path.resolve(options.file || DEFAULT_BACKUP_FILE);

  if (command === 'export') {
    console.log(`📦 Đang xuất toàn bộ dữ liệu từ ${localUri}...`);
    const { payload, totalDocs } = await readLocalDatabase(localUri);
    const serialized = EJSON.stringify(payload, null, 2, { relaxed: false });
    fs.writeFileSync(backupFile, serialized, 'utf8');

    console.log(`\n✅ Đã xuất xong ${totalDocs} documents từ ${Object.keys(payload).length} bảng vào:`);
    console.log(`   ${backupFile}\n`);
    for (const [name, docs] of Object.entries(payload)) {
      console.log(`   - ${name}: ${docs.length}`);
    }
    return;
  }

  if (command === 'import') {
    const atlasUri = resolveTargetUri(options);
    let source;

    if (options.dir) {
      console.log(`📂 Đang đọc thư mục JSON export: ${options.dir}...`);
      source = readCompassDirectory(options.dir);
    } else {
      if (!fs.existsSync(backupFile)) {
        throw new Error(
          `Không tìm thấy file backup ${backupFile}. Hãy chạy lệnh 'export' trước hoặc truyền --dir=<thư mục JSON>.`,
        );
      }
      console.log(`📂 Đang đọc file backup: ${backupFile}...`);
      const raw = fs.readFileSync(backupFile, 'utf8');
      const payload = EJSON.parse(raw, { relaxed: false });
      const totalDocs = Object.values(payload).reduce(
        (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
        0,
      );
      source = { payload, totalDocs };
    }

    await writeToAtlas(atlasUri, source.payload);
    console.log(`\n🎉 Hoàn tất nạp ${source.totalDocs} documents lên MongoDB Atlas!`);
    return;
  }

  if (command === 'push') {
    const atlasUri = resolveTargetUri(options);
    console.log(`📦 Đang đọc toàn bộ dữ liệu từ ${localUri}...`);
    const { payload, totalDocs } = await readLocalDatabase(localUri);
    await writeToAtlas(atlasUri, payload);
    console.log(`\n🎉 Hoàn tất đồng bộ trực tiếp ${totalDocs} documents từ Local lên MongoDB Atlas!`);
    return;
  }

  if (command === 'push-media') {
    const atlasUri = resolveTargetUri(options);
    const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
    await pushMediaToAtlas(atlasUri, uploadsDir, Boolean(options.all));
    return;
  }

  console.log(`
TopEnglish Atlas Sync Tool
--------------------------
1) Xuất toàn bộ DB local thành 1 file backup chuẩn EJSON:
   node top-english-backend/scripts/atlas-sync.js export

2) Đồng bộ thẳng Local -> MongoDB Atlas trong 1 lệnh:
   node top-english-backend/scripts/atlas-sync.js push --uri="mongodb+srv://..."

3) Nạp từ file top-english-backup.ejson hoặc thư mục JSON Compass lên Atlas:
   node top-english-backend/scripts/atlas-sync.js import --uri="mongodb+srv://..."
   node top-english-backend/scripts/atlas-sync.js import --dir="./compass-exports" --uri="mongodb+srv://..."
`);
}

main().catch((err) => {
  console.error(`\n❌ Lỗi: ${err.message}`);
  process.exit(1);
});
