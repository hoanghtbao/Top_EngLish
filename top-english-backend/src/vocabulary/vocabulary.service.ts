/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ thẻ từ vựng (Vocabularies), tra cứu theo chủ đề và tự động khởi tạo dữ liệu mẫu
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vocabulary, VocabularyDocument } from './schemas/vocabulary.schema';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { PartOfSpeech } from './enums/part-of-speech.enum';

@Injectable()
export class VocabularyService implements OnModuleInit {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    @InjectModel(Vocabulary.name)
    private readonly vocabularyModel: Model<VocabularyDocument>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tự động gieo dữ liệu từ vựng mẫu cho các chủ đề cơ bản nếu collection trống
   */
  async onModuleInit() {
    const vocabCount = await this.vocabularyModel.countDocuments();
    if (vocabCount === 0) {
      const admin = await this.userModel.findOne({ role: Role.ADMIN });
      if (!admin) return;

      const techTopic = await this.topicModel.findOne({ slug: 'technology-and-ai' });
      const travelTopic = await this.topicModel.findOne({ slug: 'travel-and-adventure' });
      const dailyTopic = await this.topicModel.findOne({ slug: 'daily-life-and-routine' });

      const sampleWords: Partial<Vocabulary>[] = [];

      if (techTopic) {
        sampleWords.push(
          {
            topicId: techTopic._id,
            word: 'Algorithm',
            phonetic: '/ˈæl.ɡə.rɪ.ðəm/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Thuật toán, quy trình giải quyết vấn đề từng bước',
            exampleSentence: 'The recommendation algorithm analyzes user listening habits.',
            exampleMeaning: 'Thuật toán đề xuất phân tích thói quen nghe của người dùng.',
            createdBy: admin._id,
          },
          {
            topicId: techTopic._id,
            word: 'Artificial Intelligence',
            phonetic: '/ˌɑː.tɪ.fɪʃ.əl ɪnˈtel.ɪ.dʒəns/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Trí tuệ nhân tạo (AI)',
            exampleSentence: 'Artificial intelligence is reshaping global industries at rapid speed.',
            exampleMeaning: 'Trí tuệ nhân tạo đang định hình lại các ngành công nghiệp toàn cầu với tốc độ nhanh chóng.',
            createdBy: admin._id,
          },
          {
            topicId: techTopic._id,
            word: 'Cybercrime',
            phonetic: '/ˈsaɪ.bə.kraɪm/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Tội phạm công nghệ cao, an ninh mạng',
            exampleSentence: 'Modern banks invest heavily to protect customer data from cybercrime.',
            exampleMeaning: 'Các ngân hàng hiện đại đầu tư mạnh mẽ để bảo vệ dữ liệu khách hàng khỏi tội phạm mạng.',
            createdBy: admin._id,
          },
          {
            topicId: techTopic._id,
            word: 'Database',
            phonetic: '/ˈdeɪ.tə.beɪs/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Cơ sở dữ liệu có cấu trúc',
            exampleSentence: 'All learning progress is reliably preserved in the central database.',
            exampleMeaning: 'Mọi tiến trình học tập đều được lưu trữ an toàn trong cơ sở dữ liệu trung tâm.',
            createdBy: admin._id,
          },
          {
            topicId: techTopic._id,
            word: 'Innovation',
            phonetic: '/ˌɪn.əˈveɪ.ʃən/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Sự đổi mới, sáng kiến cải tiến',
            exampleSentence: 'Continuous innovation is the key to thriving in the technology sector.',
            exampleMeaning: 'Đổi mới không ngừng là chìa khóa để phát triển mạnh mẽ trong lĩnh vực công nghệ.',
            createdBy: admin._id,
          },
          {
            topicId: techTopic._id,
            word: 'Automate',
            phonetic: '/ˈɔː.tə.meɪt/',
            partOfSpeech: PartOfSpeech.VERB,
            meaning: 'Tự động hóa tác vụ',
            exampleSentence: 'Engineers automate routine unit tests to maintain code quality.',
            exampleMeaning: 'Các kỹ sư tự động hóa các bài kiểm thử định kỳ để duy trì chất lượng mã nguồn.',
            createdBy: admin._id,
          },
        );
      }

      if (travelTopic) {
        sampleWords.push(
          {
            topicId: travelTopic._id,
            word: 'Itinerary',
            phonetic: '/aɪˈtɪn.ər.ər.i/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Lịch trình chi tiết của chuyến đi',
            exampleSentence: 'We received our comprehensive vacation itinerary from the tour agency.',
            exampleMeaning: 'Chúng tôi nhận được lịch trình nghỉ dưỡng chi tiết từ đại lý du lịch.',
            createdBy: admin._id,
          },
          {
            topicId: travelTopic._id,
            word: 'Accommodation',
            phonetic: '/əˌkɒm.əˈdeɪ.ʃən/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Chỗ ở, phòng nghỉ lưu trú',
            exampleSentence: 'High-quality hotel accommodation is included in this travel package.',
            exampleMeaning: 'Chỗ nghỉ khách sạn chất lượng cao đã bao gồm trong gói du lịch này.',
            createdBy: admin._id,
          },
          {
            topicId: travelTopic._id,
            word: 'Departure',
            phonetic: '/dɪˈpɑː.tʃər/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Sự khởi hành, chuyến bay đi',
            exampleSentence: 'Passengers should arrive two hours prior to international departure.',
            exampleMeaning: 'Hành khách nên có mặt 2 tiếng trước giờ khởi hành chuyến bay quốc tế.',
            createdBy: admin._id,
          },
          {
            topicId: travelTopic._id,
            word: 'Destination',
            phonetic: '/ˌdes.tɪˈneɪ.ʃən/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Điểm đến, nơi dự định tới',
            exampleSentence: 'Da Nang is a premier beach destination for domestic and foreign tourists.',
            exampleMeaning: 'Đà Nẵng là điểm đến ven biển hàng đầu cho du khách trong và ngoài nước.',
            createdBy: admin._id,
          },
          {
            topicId: travelTopic._id,
            word: 'Explore',
            phonetic: '/ɪkˈsplɔːr/',
            partOfSpeech: PartOfSpeech.VERB,
            meaning: 'Khám phá, thám hiểm nơi chốn mới',
            exampleSentence: 'We spent the sunny morning exploring the old quarter on foot.',
            exampleMeaning: 'Chúng tôi dành cả buổi sáng đầy nắng để đi bộ khám phá phố cổ.',
            createdBy: admin._id,
          },
          {
            topicId: travelTopic._id,
            word: 'Breathtaking',
            phonetic: '/ˈbreθˌteɪ.kɪŋ/',
            partOfSpeech: PartOfSpeech.ADJECTIVE,
            meaning: 'Đẹp ngoạn mục, hùng vĩ đến nín thở',
            exampleSentence: 'The mountain view at sunrise was truly breathtaking.',
            exampleMeaning: 'Khung cảnh ngọn núi lúc bình minh thật sự đẹp đến ngỡ ngàng.',
            createdBy: admin._id,
          },
        );
      }

      if (dailyTopic) {
        sampleWords.push(
          {
            topicId: dailyTopic._id,
            word: 'Habit',
            phonetic: '/ˈhæb.ɪt/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Thói quen thường làm',
            exampleSentence: 'Reading fifteen minutes before sleep is an excellent daily habit.',
            exampleMeaning: 'Đọc sách 15 phút trước khi đi ngủ là một thói quen hằng ngày tuyệt vời.',
            createdBy: admin._id,
          },
          {
            topicId: dailyTopic._id,
            word: 'Routine',
            phonetic: '/ruːˈtiːn/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Thời gian biểu, công việc quen thuộc thường nhật',
            exampleSentence: 'A consistent morning routine helps set a positive tone for the whole day.',
            exampleMeaning: 'Một thói quen buổi sáng đều đặn giúp tạo tâm trạng tích cực cho cả ngày.',
            createdBy: admin._id,
          },
          {
            topicId: dailyTopic._id,
            word: 'Chore',
            phonetic: '/tʃɔːr/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Việc vặt thường nhật trong nhà',
            exampleSentence: 'Doing household chores together makes family bonding stronger.',
            exampleMeaning: 'Cùng nhau làm việc nhà giúp tình cảm gia đình thêm gắn kết.',
            createdBy: admin._id,
          },
          {
            topicId: dailyTopic._id,
            word: 'Commute',
            phonetic: '/kəˈmjuːt/',
            partOfSpeech: PartOfSpeech.VERB,
            meaning: 'Di chuyển đều đặn từ nhà đến nơi làm việc',
            exampleSentence: 'She commutes to her university campus by public bus every weekday.',
            exampleMeaning: 'Cô ấy đi xe buýt công cộng đến khuôn viên trường đại học vào các ngày trong tuần.',
            createdBy: admin._id,
          },
          {
            topicId: dailyTopic._id,
            word: 'Productive',
            phonetic: '/prəˈdʌk.tɪv/',
            partOfSpeech: PartOfSpeech.ADJECTIVE,
            meaning: 'Năng suất, hiệu quả cao',
            exampleSentence: 'He completed three critical project milestones during a productive morning.',
            exampleMeaning: 'Anh ấy đã hoàn thành 3 mốc dự án quan trọng trong một buổi sáng làm việc năng suất.',
            createdBy: admin._id,
          },
          {
            topicId: dailyTopic._id,
            word: 'Leisure',
            phonetic: '/ˈleʒ.ər/',
            partOfSpeech: PartOfSpeech.NOUN,
            meaning: 'Thời gian rảnh rỗi, nghỉ ngơi thư giãn',
            exampleSentence: 'Balancing focused study hours with pleasant leisure time reduces stress.',
            exampleMeaning: 'Cân bằng giữa giờ học tập trung và thời gian giải trí thư giãn giúp giảm căng thẳng.',
            createdBy: admin._id,
          },
        );
      }

      if (sampleWords.length > 0) {
        await this.vocabularyModel.insertMany(sampleWords);
        this.logger.log(`🌱 Đã tự động khởi tạo ${sampleWords.length} thẻ từ vựng mẫu có IPA và ví dụ`);

        // Cập nhật lại wordCount chính xác cho các topics
        if (techTopic) {
          const c = await this.vocabularyModel.countDocuments({ topicId: techTopic._id });
          await this.topicModel.findByIdAndUpdate(techTopic._id, { wordCount: c });
        }
        if (travelTopic) {
          const c = await this.vocabularyModel.countDocuments({ topicId: travelTopic._id });
          await this.topicModel.findByIdAndUpdate(travelTopic._id, { wordCount: c });
        }
        if (dailyTopic) {
          const c = await this.vocabularyModel.countDocuments({ topicId: dailyTopic._id });
          await this.topicModel.findByIdAndUpdate(dailyTopic._id, { wordCount: c });
        }
      }
    }
  }

  /**
   * Lấy danh sách từ vựng theo chủ đề (Hỗ trợ tìm kiếm từ khóa theo word / meaning)
   */
  async findByTopic(topicId: string, search?: string): Promise<VocabularyDocument[]> {
    let resolvedTopicId = topicId;

    // Nếu truyền slug thay vì ObjectId, tìm topic trước
    if (!Types.ObjectId.isValid(topicId)) {
      const topic = await this.topicModel.findOne({ slug: topicId }).exec();
      if (!topic) {
        throw new NotFoundException(`Không tìm thấy chủ đề với slug "${topicId}"`);
      }
      resolvedTopicId = topic._id.toString();
    }

    const filter: Record<string, any> = {
      topicId: new Types.ObjectId(resolvedTopicId),
    };

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ word: searchRegex }, { meaning: searchRegex }];
    }

    return this.vocabularyModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  /**
   * Xem chi tiết một thẻ từ vựng
   */
  async findById(id: string): Promise<VocabularyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID từ vựng không hợp lệ');
    }

    const word = await this.vocabularyModel.findById(id).populate('topicId', 'title slug level').exec();
    if (!word) {
      throw new NotFoundException(`Không tìm thấy từ vựng có ID ${id}`);
    }

    return word;
  }

  /**
   * Thêm từ vựng mới vào chủ đề
   */
  async create(createVocabularyDto: CreateVocabularyDto, userId: string): Promise<VocabularyDocument> {
    if (!Types.ObjectId.isValid(createVocabularyDto.topicId)) {
      throw new BadRequestException('ID chủ đề không hợp lệ');
    }

    const topic = await this.topicModel.findById(createVocabularyDto.topicId);
    if (!topic) {
      throw new NotFoundException(`Không tìm thấy chủ đề có ID ${createVocabularyDto.topicId}`);
    }

    const newVocab = new this.vocabularyModel({
      ...createVocabularyDto,
      topicId: new Types.ObjectId(createVocabularyDto.topicId),
      createdBy: new Types.ObjectId(userId),
    });

    const saved = await newVocab.save();

    // Cập nhật tăng số lượng từ của topic
    await this.topicModel.findByIdAndUpdate(createVocabularyDto.topicId, { $inc: { wordCount: 1 } });

    return saved;
  }

  /**
   * Cập nhật từ vựng
   */
  async update(id: string, updateVocabularyDto: UpdateVocabularyDto): Promise<VocabularyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID từ vựng không hợp lệ');
    }

    const updated = await this.vocabularyModel
      .findByIdAndUpdate(id, { $set: updateVocabularyDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy từ vựng có ID ${id}`);
    }

    return updated;
  }

  /**
   * Xóa từ vựng khỏi hệ thống
   */
  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID từ vựng không hợp lệ');
    }

    const vocab = await this.vocabularyModel.findByIdAndDelete(id).exec();
    if (!vocab) {
      throw new NotFoundException(`Không tìm thấy từ vựng có ID ${id}`);
    }

    // Giảm số lượng từ của chủ đề tương ứng
    await this.topicModel.findByIdAndUpdate(vocab.topicId, { $inc: { wordCount: -1 } });

    return { deleted: true, message: `Đã xóa thành công từ vựng "${vocab.word}"` };
  }
}
