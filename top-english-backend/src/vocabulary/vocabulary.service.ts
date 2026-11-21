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
import { BulkCreateVocabularyDto } from './dto/bulk-create-vocabulary.dto';
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

    // Bổ sung từ vựng mẫu cho các bài học trong lớp học TOEIC 2 (nếu chưa có từ vựng)
    await this.seedClassLessonVocabularies();
  }

  /**
   * Gieo từ vựng mẫu cho các bài học mặc định của Lớp học TOEIC 2 nếu bài học chưa có từ nào
   */
  private async seedClassLessonVocabularies() {
    const admin = await this.userModel.findOne({ role: Role.ADMIN });
    if (!admin) return;

    const lessonWordBank: Record<
      string,
      Array<{
        word: string;
        phonetic: string;
        partOfSpeech: PartOfSpeech;
        meaning: string;
        exampleSentence: string;
        exampleMeaning: string;
      }>
    > = {
      'toeic2-lesson-8-articles-reports': [
        {
          word: 'Editorial',
          phonetic: '/ˌed.ɪˈtɔː.ri.əl/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Bài xã luận, bài bình luận của ban biên tập',
          exampleSentence: 'The newspaper published a compelling editorial on renewable energy.',
          exampleMeaning: 'Tờ báo đã đăng một bài xã luận thuyết phục về năng lượng tái tạo.',
        },
        {
          word: 'Quarterly',
          phonetic: '/ˈkwɔː.tə.li/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Hằng quý (ba tháng một lần)',
          exampleSentence: 'The finance team presented the quarterly revenue report to the board.',
          exampleMeaning: 'Đội ngũ tài chính đã trình bày báo cáo doanh thu hằng quý trước hội đồng quản trị.',
        },
        {
          word: 'Summarize',
          phonetic: '/ˈsʌm.ə.raɪz/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Tóm tắt, tổng hợp lại nội dung chính',
          exampleSentence: 'Please summarize the key findings at the beginning of your report.',
          exampleMeaning: 'Vui lòng tóm tắt các phát hiện chính ở phần đầu báo cáo của bạn.',
        },
        {
          word: 'Forecast',
          phonetic: '/ˈfɔː.kɑːst/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Dự báo (kinh tế, doanh số, thời tiết)',
          exampleSentence: 'According to the latest market forecast, exports will rise by 8%.',
          exampleMeaning: 'Theo dự báo thị trường mới nhất, kim ngạch xuất khẩu sẽ tăng 8%.',
        },
        {
          word: 'Substantial',
          phonetic: '/səbˈstæn.ʃəl/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Đáng kể, lớn lao, vững chắc',
          exampleSentence: 'The company recorded a substantial increase in online subscriptions.',
          exampleMeaning: 'Công ty ghi nhận mức tăng đáng kể về số lượng đăng ký trực tuyến.',
        },
      ],
      'toeic2-lesson-7-everyday-transactions': [
        {
          word: 'Inquiry',
          phonetic: '/ɪnˈkwaɪə.ri/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Câu hỏi thắc mắc, yêu cầu cung cấp thông tin',
          exampleSentence: 'Customer service responds to every billing inquiry within 24 hours.',
          exampleMeaning: 'Bộ phận chăm sóc khách hàng phản hồi mọi thắc mắc hóa đơn trong vòng 24 giờ.',
        },
        {
          word: 'Receipt',
          phonetic: '/rɪˈsiːt/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Biên lai, hóa đơn xác nhận đã thanh toán',
          exampleSentence: 'Keep your receipt in case you need to exchange the item later.',
          exampleMeaning: 'Hãy giữ lại biên lai phòng trường hợp bạn cần đổi trả sản phẩm sau này.',
        },
        {
          word: 'Refund',
          phonetic: '/ˈriː.fʌnd/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Khoản tiền hoàn trả',
          exampleSentence: 'You are eligible for a full refund if you cancel before Friday.',
          exampleMeaning: 'Bạn đủ điều kiện được hoàn tiền 100% nếu hủy trước thứ Sáu.',
        },
        {
          word: 'Confirm',
          phonetic: '/kənˈfɜːm/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Xác nhận lại (lịch hẹn, đơn hàng)',
          exampleSentence: 'We will send an email to confirm your hotel reservation.',
          exampleMeaning: 'Chúng tôi sẽ gửi email để xác nhận đặt phòng khách sạn của bạn.',
        },
        {
          word: 'Convenience',
          phonetic: '/kənˈviː.ni.əns/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Sự thuận tiện, tiện lợi',
          exampleSentence: 'For your convenience, digital invoices are available in your account.',
          exampleMeaning: 'Để thuận tiện cho bạn, hóa đơn điện tử luôn có sẵn trong tài khoản.',
        },
      ],
    };

    let insertedTotal = 0;
    for (const [slug, words] of Object.entries(lessonWordBank)) {
      const topic = await this.topicModel.findOne({ slug }).exec();
      if (!topic) continue;

      const existingCount = await this.vocabularyModel.countDocuments({ topicId: topic._id });
      if (existingCount === 0) {
        const docs = words.map((w) => ({
          ...w,
          topicId: topic._id,
          createdBy: admin._id,
        }));
        await this.vocabularyModel.insertMany(docs);
        await this.topicModel.findByIdAndUpdate(topic._id, { wordCount: docs.length });
        insertedTotal += docs.length;
      }
    }

    if (insertedTotal > 0) {
      this.logger.log(`🌱 Đã bổ sung ${insertedTotal} thẻ từ vựng mẫu cho các bài học lớp TOEIC 2`);
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
   * Thêm hàng loạt thẻ từ vựng vào chủ đề từ danh sách JSON
   */
  async createBulk(
    bulkDto: BulkCreateVocabularyDto,
    userId: string,
  ): Promise<{ insertedCount: number; vocabularies: VocabularyDocument[] }> {
    if (!Types.ObjectId.isValid(bulkDto.topicId)) {
      throw new BadRequestException('ID chủ đề không hợp lệ');
    }

    const topic = await this.topicModel.findById(bulkDto.topicId);
    if (!topic) {
      throw new NotFoundException(`Không tìm thấy chủ đề có ID ${bulkDto.topicId}`);
    }

    const topicObjectId = new Types.ObjectId(bulkDto.topicId);
    const creatorObjectId = new Types.ObjectId(userId);

    const docsToInsert = bulkDto.items.map((item) => ({
      topicId: topicObjectId,
      word: item.word.trim(),
      phonetic: item.phonetic?.trim() || '',
      partOfSpeech: item.partOfSpeech || PartOfSpeech.NOUN,
      meaning: item.meaning.trim(),
      exampleSentence: item.exampleSentence?.trim() || '',
      exampleMeaning: item.exampleMeaning?.trim() || '',
      audioUrl: item.audioUrl?.trim() || '',
      createdBy: creatorObjectId,
    }));

    const inserted = await this.vocabularyModel.insertMany(docsToInsert);

    // Đồng bộ lại chính xác tổng số từ của chủ đề
    const totalCount = await this.vocabularyModel.countDocuments({ topicId: topicObjectId });
    await this.topicModel.findByIdAndUpdate(bulkDto.topicId, { wordCount: totalCount });

    return {
      insertedCount: inserted.length,
      vocabularies: inserted as unknown as VocabularyDocument[],
    };
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
