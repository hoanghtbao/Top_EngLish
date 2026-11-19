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

    // Bổ sung từ vựng mẫu cho các chủ đề TOEIC & IELTS mới nếu chủ đề đó chưa có từ nào
    await this.seedTrackVocabularies();
  }

  /**
   * Gieo từ vựng mẫu cho các chuyên đề TOEIC và IELTS nếu chủ đề chưa có dữ liệu từ vựng
   */
  private async seedTrackVocabularies() {
    const admin = await this.userModel.findOne({ role: Role.ADMIN });
    if (!admin) return;

    const trackWordBank: Record<
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
      'toeic-office-and-meetings': [
        {
          word: 'Agenda',
          phonetic: '/əˈdʒen.də/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Chương trình nghị sự, lịch trình cuộc họp',
          exampleSentence: 'Please review the meeting agenda before we start at 9:00 AM.',
          exampleMeaning: 'Vui lòng xem qua chương trình cuộc họp trước khi chúng ta bắt đầu lúc 9 giờ sáng.',
        },
        {
          word: 'Schedule',
          phonetic: '/ˈskedʒ.uːl/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Lên lịch, sắp xếp thời gian biểu',
          exampleSentence: 'The HR manager scheduled an interview with the candidate for Friday.',
          exampleMeaning: 'Trưởng phòng nhân sự đã lên lịch phỏng vấn với ứng viên vào thứ Sáu.',
        },
        {
          word: 'Colleague',
          phonetic: '/ˈkɒl.iːɡ/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Đồng nghiệp cùng công ty',
          exampleSentence: 'I collaborated closely with my colleagues on the quarterly report.',
          exampleMeaning: 'Tôi đã phối hợp chặt chẽ với các đồng nghiệp để hoàn thành báo cáo quý.',
        },
        {
          word: 'Submit',
          phonetic: '/səbˈmɪt/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Nộp, đệ trình (báo cáo, hồ sơ)',
          exampleSentence: 'All expense forms must be submitted by the end of the month.',
          exampleMeaning: 'Tất cả phiếu chi phí phải được nộp trước cuối tháng.',
        },
        {
          word: 'Deadline',
          phonetic: '/ˈded.laɪn/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Hạn chót hoàn thành công việc',
          exampleSentence: 'Our team worked overtime to meet the strict project deadline.',
          exampleMeaning: 'Nhóm chúng tôi đã làm thêm giờ để kịp hạn chót nghiêm ngặt của dự án.',
        },
      ],
      'toeic-finance-and-contracts': [
        {
          word: 'Invoice',
          phonetic: '/ˈɪn.vɔɪs/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Hóa đơn thanh toán hàng hóa/dịch vụ',
          exampleSentence: 'Please attach the original invoice to your reimbursement request.',
          exampleMeaning: 'Vui lòng đính kèm hóa đơn gốc vào yêu cầu hoàn tiền của bạn.',
        },
        {
          word: 'Negotiate',
          phonetic: '/nəˈɡəʊ.ʃi.eɪt/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Đàm phán, thương lượng điều khoản',
          exampleSentence: 'Both companies spent weeks negotiating the renewal contract.',
          exampleMeaning: 'Cả hai công ty đã dành nhiều tuần để thương lượng hợp đồng gia hạn.',
        },
        {
          word: 'Budget',
          phonetic: '/ˈbʌdʒ.ɪt/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Ngân sách dự toán',
          exampleSentence: 'The marketing department stayed strictly within its annual budget.',
          exampleMeaning: 'Phòng tiếp thị đã chi tiêu chặt chẽ trong phạm vi ngân sách hằng năm.',
        },
        {
          word: 'Authorize',
          phonetic: '/ˈɔː.θə.raɪz/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Ủy quyền, phê duyệt chính thức',
          exampleSentence: 'Only the finance director can authorize purchases over $5,000.',
          exampleMeaning: 'Chỉ giám đốc tài chính mới có thể phê duyệt các giao dịch trên 5.000 đô la.',
        },
        {
          word: 'Profitable',
          phonetic: '/ˈprɒf.ɪ.tə.bəl/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Có lợi nhuận, sinh lời cao',
          exampleSentence: 'Expanding into online retail proved to be a highly profitable decision.',
          exampleMeaning: 'Việc mở rộng sang bán lẻ trực tuyến đã chứng minh là một quyết định sinh lời cao.',
        },
      ],
      'toeic-logistics-and-supply': [
        {
          word: 'Inventory',
          phonetic: '/ˈɪn.vən.tər.i/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Hàng tồn kho, bảng kiểm kê hàng hóa',
          exampleSentence: 'The warehouse uses barcode scanners to track inventory in real time.',
          exampleMeaning: 'Nhà kho sử dụng máy quét mã vạch để theo dõi hàng tồn kho theo thời gian thực.',
        },
        {
          word: 'Shipment',
          phonetic: '/ˈʃɪp.mənt/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Lô hàng vận chuyển',
          exampleSentence: 'The overseas shipment was delayed due to severe weather at the port.',
          exampleMeaning: 'Lô hàng quốc tế bị trì hoãn do thời tiết khắc nghiệt tại cảng.',
        },
        {
          word: 'Distribute',
          phonetic: '/dɪˈstrɪb.juːt/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Phân phối, giao hàng đến các đại lý',
          exampleSentence: 'We distribute organic products to over 200 supermarkets nationwide.',
          exampleMeaning: 'Chúng tôi phân phối sản phẩm hữu cơ tới hơn 200 siêu thị trên toàn quốc.',
        },
        {
          word: 'Defective',
          phonetic: '/dɪˈfek.tɪv/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Bị lỗi, khiếm khuyết (sản phẩm)',
          exampleSentence: 'Customers are entitled to a full refund for any defective merchandise.',
          exampleMeaning: 'Khách hàng được hoàn tiền đầy đủ đối với bất kỳ hàng hóa nào bị lỗi.',
        },
        {
          word: 'Expedite',
          phonetic: '/ˈek.spə.daɪt/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Đẩy nhanh tiến độ xử lý, giao gấp',
          exampleSentence: 'We paid an extra fee to expedite the delivery of spare parts.',
          exampleMeaning: 'Chúng tôi đã trả thêm phí để đẩy nhanh việc giao phụ tùng thay thế.',
        },
      ],
      'toeic-executive-strategy': [
        {
          word: 'Acquisition',
          phonetic: '/ˌæk.wɪˈzɪʃ.ən/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Sự thâu tóm, mua lại doanh nghiệp',
          exampleSentence: 'The acquisition of the fintech startup boosted our market share.',
          exampleMeaning: 'Thương vụ mua lại công ty khởi nghiệp fintech đã giúp tăng thị phần của chúng tôi.',
        },
        {
          word: 'Lucrative',
          phonetic: '/ˈluː.krə.tɪv/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Sinh lợi lớn, béo bở (hợp đồng/thị trường)',
          exampleSentence: 'The consulting firm secured a lucrative three-year government contract.',
          exampleMeaning: 'Công ty tư vấn đã giành được hợp đồng chính phủ béo bở kéo dài ba năm.',
        },
        {
          word: 'Consolidate',
          phonetic: '/kənˈsɒl.ɪ.deɪt/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Củng cố, hợp nhất các bộ phận/nguồn lực',
          exampleSentence: 'Management decided to consolidate three regional offices into one hub.',
          exampleMeaning: 'Ban lãnh đạo quyết định hợp nhất ba văn phòng khu vực thành một trung tâm.',
        },
        {
          word: 'Compliance',
          phonetic: '/kəmˈplaɪ.əns/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Sự tuân thủ quy định, pháp luật',
          exampleSentence: 'Every branch must pass the annual safety compliance audit.',
          exampleMeaning: 'Mỗi chi nhánh phải vượt qua kỳ kiểm toán tuân thủ an toàn hằng năm.',
        },
        {
          word: 'Unanimously',
          phonetic: '/juːˈnæn.ɪ.məs.li/',
          partOfSpeech: PartOfSpeech.ADVERB,
          meaning: 'Một cách nhất trí hoàn toàn',
          exampleSentence: 'The board of directors unanimously approved the expansion plan.',
          exampleMeaning: 'Hội đồng quản trị đã nhất trí hoàn toàn thông qua kế hoạch mở rộng.',
        },
      ],
      'ielts-education-and-research': [
        {
          word: 'Curriculum',
          phonetic: '/kəˈrɪk.jə.ləm/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Chương trình giảng dạy chính khóa',
          exampleSentence: 'Critical thinking should be integrated into the secondary school curriculum.',
          exampleMeaning: 'Tư duy phản biện nên được tích hợp vào chương trình giảng dạy trung học.',
        },
        {
          word: 'Pedagogy',
          phonetic: '/ˈped.ə.ɡɒdʒ.i/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Phương pháp sư phạm, khoa học giảng dạy',
          exampleSentence: 'Modern pedagogy emphasizes interactive learning over rote memorization.',
          exampleMeaning: 'Phương pháp sư phạm hiện đại nhấn mạnh việc học tương tác hơn là học vẹt.',
        },
        {
          word: 'Empirical',
          phonetic: '/ɪmˈpɪr.ɪ.kəl/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Dựa trên thực nghiệm và quan sát thực tế',
          exampleSentence: 'The researchers provided strong empirical evidence to support their theory.',
          exampleMeaning: 'Các nhà nghiên cứu đã cung cấp bằng chứng thực nghiệm vững chắc cho học thuyết.',
        },
        {
          word: 'Foster',
          phonetic: '/ˈfɒs.tər/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Nuôi dưỡng, thúc đẩy phát triển (kỹ năng/sáng tạo)',
          exampleSentence: 'Collaborative projects help foster creativity and teamwork among students.',
          exampleMeaning: 'Các dự án nhóm giúp nuôi dưỡng sự sáng tạo và tinh thần đồng đội ở học sinh.',
        },
        {
          word: 'Literacy',
          phonetic: '/ˈlɪt.ər.ə.si/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Trình độ đọc viết, sự am hiểu (ví dụ: digital literacy)',
          exampleSentence: 'Digital literacy has become an indispensable skill in higher education.',
          exampleMeaning: 'Năng lực số đã trở thành kỹ năng không thể thiếu trong giáo dục đại học.',
        },
      ],
      'ielts-environment-and-climate': [
        {
          word: 'Mitigate',
          phonetic: '/ˈmɪt.ɪ.ɡeɪt/',
          partOfSpeech: PartOfSpeech.VERB,
          meaning: 'Giảm nhẹ, làm dịu bớt tác động tiêu cực',
          exampleSentence: 'Governments must enact strict policies to mitigate the effects of global warming.',
          exampleMeaning: 'Chính phủ cần ban hành chính sách nghiêm ngặt để giảm nhẹ tác động của sự nóng lên toàn cầu.',
        },
        {
          word: 'Biodiversity',
          phonetic: '/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Đa dạng sinh học',
          exampleSentence: 'Deforestation poses a severe threat to tropical rainforest biodiversity.',
          exampleMeaning: 'Nạn phá rừng gây ra mối đe dọa nghiêm trọng đối với đa dạng sinh học rừng nhiệt đới.',
        },
        {
          word: 'Renewable',
          phonetic: '/rɪˈnjuː.ə.bəl/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Có thể tái tạo (năng lượng mặt trời, gió)',
          exampleSentence: 'Transitioning to renewable energy sources reduces carbon emissions dramatically.',
          exampleMeaning: 'Chuyển đổi sang các nguồn năng lượng tái tạo giúp giảm mạnh lượng khí thải carbon.',
        },
        {
          word: 'Depletion',
          phonetic: '/dɪˈpliː.ʃən/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Sự cạn kiệt, suy giảm tài nguyên',
          exampleSentence: 'Overconsumption is accelerating the rapid depletion of freshwater reserves.',
          exampleMeaning: 'Tiêu thụ quá mức đang đẩy nhanh sự cạn kiệt nguồn nước ngọt dự trữ.',
        },
        {
          word: 'Ecological',
          phonetic: '/ˌiː.kəˈlɒdʒ.ɪ.kəl/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Thuộc về sinh thái học',
          exampleSentence: 'Plastic waste causes long-lasting ecological damage to marine habitats.',
          exampleMeaning: 'Rác thải nhựa gây ra tổn hại sinh thái lâu dài cho môi trường sống dưới biển.',
        },
      ],
      'ielts-urbanization-and-society': [
        {
          word: 'Infrastructure',
          phonetic: '/ˈɪn.frəˌstrʌk.tʃər/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Cơ sở hạ tầng (giao thông, điện, nước)',
          exampleSentence: 'Rapid population growth puts immense strain on urban transport infrastructure.',
          exampleMeaning: 'Tăng trưởng dân số nhanh gây áp lực lớn lên hạ tầng giao thông đô thị.',
        },
        {
          word: 'Disparity',
          phonetic: '/dɪˈspær.ə.ti/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Sự chênh lệch, bất bình đẳng (thu nhập, cơ hội)',
          exampleSentence: 'Policies should aim to narrow the economic disparity between rural and urban areas.',
          exampleMeaning: 'Các chính sách cần hướng tới thu hẹp khoảng cách kinh tế giữa nông thôn và thành thị.',
        },
        {
          word: 'Congestion',
          phonetic: '/kənˈdʒes.tʃən/',
          partOfSpeech: PartOfSpeech.NOUN,
          meaning: 'Sự tắc nghẽn, ùn tắc giao thông',
          exampleSentence: 'Expanding metro networks is an effective remedy for severe traffic congestion.',
          exampleMeaning: 'Mở rộng mạng lưới tàu điện ngầm là giải pháp hiệu quả cho tình trạng tắc nghẽn giao thông.',
        },
        {
          word: 'Sustainable',
          phonetic: '/səˈsteɪ.nə.bəl/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Bền vững, lâu dài',
          exampleSentence: 'Architects are designing sustainable smart cities with abundant green spaces.',
          exampleMeaning: 'Các kiến trúc sư đang thiết kế những thành phố thông minh bền vững với nhiều mảng xanh.',
        },
        {
          word: 'Demographic',
          phonetic: '/ˌdem.əˈɡræf.ɪk/',
          partOfSpeech: PartOfSpeech.ADJECTIVE,
          meaning: 'Thuộc về nhân khẩu học, cơ cấu dân số',
          exampleSentence: 'Many developed nations are facing major demographic shifts due to aging populations.',
          exampleMeaning: 'Nhiều quốc gia phát triển đang đối mặt với biến động nhân khẩu học lớn do già hóa dân số.',
        },
      ],
    };

    let insertedTotal = 0;
    for (const [slug, words] of Object.entries(trackWordBank)) {
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
      this.logger.log(`🌱 Đã bổ sung ${insertedTotal} thẻ từ vựng mẫu cho các chuyên đề TOEIC & IELTS`);
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
