# TOP-ENGLISH --- Kế hoạch phát triển dự án theo từng giai đoạn

> **Nguyên tắc làm việc:** Không triển khai toàn bộ hệ thống cùng lúc.
> Mỗi giai đoạn phải có mục tiêu, đầu việc, sản phẩm bàn giao và tiêu
> chí nghiệm thu. Sau khi hoàn thành, dừng lại để review cùng người
> dùng. Chỉ chuyển sang giai đoạn tiếp theo khi người dùng xác nhận **OK
> / tiếp tục**.

## 1. Tổng quan dự án

**Tên dự án:** Top-English\
**Mục tiêu:** Xây dựng nền tảng web hỗ trợ học tiếng Anh từ vựng, ngữ
pháp và luyện tập; theo dõi tiến độ cá nhân; ứng dụng AI để giải thích,
sửa lỗi và đề xuất nội dung luyện tập phù hợp.

### 1.1. Phạm vi nghiệp vụ dự kiến

-   Học từ vựng theo chủ đề và trình độ.
-   Học ngữ pháp theo chủ điểm.
-   Luyện tập qua trắc nghiệm, điền từ, sắp xếp câu và viết câu.
-   Phát âm từ vựng bằng công nghệ trình duyệt hoặc nguồn audio phù hợp.
-   Ôn tập từ vựng theo lịch lặp lại ngắt quãng (Spaced Repetition).
-   Theo dõi tiến độ, lịch sử học và chuỗi ngày học (Streak).
-   AI hỗ trợ giải thích, sửa lỗi và tạo bài tập.
-   Giáo viên quản lý học liệu, bài tập và lớp học.
-   Quản trị viên quản lý tài khoản, phân quyền và cấu hình hệ thống.
-   Có thể bổ sung người kiểm duyệt nội dung ở giai đoạn mở rộng.

### 1.2. Nguyên tắc phạm vi

1.  Ưu tiên hoàn thành luồng học tập cốt lõi trước các tính năng mở
    rộng.
2.  Không xây dựng AI quá rộng ngay từ đầu; mỗi tính năng AI phải có đầu
    vào, đầu ra và giới hạn rõ ràng.
3.  Không để người dùng có quyền sửa/xóa nội dung ngoài phạm vi được
    giao.
4.  Giáo viên cũng có thể sử dụng các chức năng học tập như học viên.
5.  Tách quyền theo **vai trò** và **quyền trên từng tài nguyên**. Ví
    dụ: giáo viên chỉ sửa được nội dung do mình tạo hoặc nội dung được
    phân công.
6.  Các thao tác quan trọng như xuất bản, khóa tài khoản, xóa dữ liệu
    phải có kiểm tra quyền và xác nhận phù hợp.

------------------------------------------------------------------------

## 2. Công nghệ dự kiến (Tech Stack)

Đây là công nghệ định hướng ban đầu. Cần xác nhận phiên bản cụ thể và
khả năng tương thích khi bắt đầu triển khai, không mặc định mọi phiên
bản thư viện đều tương thích với nhau.

### 2.1. Frontend

  -----------------------------------------------------------------------
  Công nghệ                           Vai trò dự kiến
  ----------------------------------- -----------------------------------
  Next.js (App Router) + TypeScript   Xây dựng giao diện web, định tuyến
                                      và cấu trúc ứng dụng

  Tailwind CSS                        Thiết kế giao diện responsive

  shadcn/ui                           Các thành phần giao diện như
                                      Button, Dialog, Card, Tabs

  Lucide React                        Biểu tượng giao diện

  Framer Motion                       Hiệu ứng chuyển động, ví dụ lật
                                      Flashcard

  Web Speech API                      Đọc từ/câu bằng giọng có sẵn trên
                                      trình duyệt

  canvas-confetti                     Hiệu ứng chúc mừng khi hoàn thành
                                      mục tiêu
  -----------------------------------------------------------------------

**Lưu ý:** Web Speech API phụ thuộc trình duyệt và hệ điều hành; giọng
đọc, chất lượng và khả năng chọn giọng US/UK không được đảm bảo giống
nhau trên mọi thiết bị. Cần có phương án dự phòng bằng file audio nếu
cần phát âm ổn định.

### 2.2. Backend

  Công nghệ                      Vai trò dự kiến
  ------------------------------ -------------------------------------
  NestJS + TypeScript            Xây dựng REST API theo module
  @nestjs/mongoose + Mongoose    Kết nối và thao tác MongoDB
  @nestjs/jwt                    Tạo và xác minh JWT
  Passport + passport-jwt        Xác thực bằng JWT
  bcrypt                         Băm mật khẩu
  class-validator                Kiểm tra dữ liệu DTO
  class-transformer              Chuyển đổi dữ liệu đầu vào
  @nestjs/config                 Quản lý cấu hình và biến môi trường
  @nestjs/swagger + Swagger UI   Tài liệu và kiểm thử API

**Lưu ý bảo mật:** Không lưu mật khẩu dạng văn bản. Không đưa secret,
chuỗi kết nối hoặc khóa API lên Git. Access Token và Refresh Token cần
có thời hạn, cơ chế lưu trữ và thu hồi phù hợp; không chỉ tạo token mà
bỏ qua quy trình đăng xuất/đổi token.

### 2.3. Database

  -----------------------------------------------------------------------
  Công nghệ                           Vai trò dự kiến
  ----------------------------------- -----------------------------------
  MongoDB                             Cơ sở dữ liệu NoSQL

  MongoDB Atlas                       Cơ sở dữ liệu cloud, có thể bắt đầu
                                      với gói miễn phí nếu còn phù hợp

  Docker (tùy chọn)                   Chạy môi trường phát triển nhất
                                      quán ở máy cá nhân
  -----------------------------------------------------------------------

Các nhóm dữ liệu dự kiến:

-   Users, Roles, Permissions.
-   Vocabulary, Topics, GrammarLessons.
-   Quizzes, Questions, Answers.
-   LearningSessions, UserProgress, VocabularyReview.
-   Classes, ClassMembers, Assignments, Submissions.
-   ContentReviews, Notifications, ActivityLogs.
-   AIUsageLogs hoặc dữ liệu theo dõi lượt sử dụng AI nếu cần.

Không chốt thiết kế collection ngay trong tài liệu này. Cấu trúc MongoDB
sẽ được thiết kế và review ở giai đoạn phân tích dữ liệu.

### 2.4. Công nghệ học tiếng Anh

**Phát âm** - Web Speech API (`speechSynthesis`) để đọc từ/câu bằng
giọng có sẵn của trình duyệt. - Free Dictionary API có thể được khảo sát
để lấy nghĩa, IPA và audio. - Cần kiểm tra giấy phép, giới hạn truy cập,
độ đầy đủ dữ liệu và nguồn audio trước khi phụ thuộc vào API bên
ngoài. - Có thể lưu nguồn audio hoặc URL audio hợp lệ trong dữ liệu từ
vựng.

**Spaced Repetition** - Bản đầu dùng quy tắc dễ hiểu, dễ kiểm thử: từ
chưa nhớ được ôn sớm hơn; từ đã nhớ được tăng khoảng cách ôn. - Mốc thử
nghiệm ban đầu có thể là 1 ngày, 3 ngày, 7 ngày; đây là cấu hình khởi
đầu, không phải quy luật cố định. - Lưu lịch sử ôn tập, mức độ nhớ, lần
ôn tiếp theo và số lần trả lời đúng/sai. - Chỉ nâng cấp thuật toán khi
đã có dữ liệu sử dụng và tiêu chí đánh giá.

**Gamification** - Streak: ghi nhận ngày học có hoạt động hợp lệ. - Điểm
học tập: quy định cách tính rõ ràng, tránh cộng điểm chỉ bằng việc mở
trang. - canvas-confetti: chỉ là hiệu ứng giao diện, không phải thành
phần nghiệp vụ cốt lõi.

### 2.5. Phần AI --- chưa chốt nhà cung cấp

Các hướng tính năng: - Giải thích nghĩa và cách dùng từ vựng theo trình
độ. - Giải thích nguyên nhân câu trả lời ngữ pháp sai. - Sửa câu tiếng
Anh và nêu lỗi. - Tạo câu ví dụ hoặc bài tập từ nội dung đã học. - Gợi ý
ôn tập dựa trên lỗi và tiến độ.

Trước khi tích hợp cần xác định: mô hình/API sử dụng, chi phí, giới hạn
lượt dùng, cách kiểm tra đầu ra, bảo vệ dữ liệu người học và cơ chế xử
lý khi AI lỗi. Không để AI tự ý thay thế đáp án/chấm điểm nếu chưa có
quy tắc kiểm chứng.

------------------------------------------------------------------------

## 3. Phân quyền và nghiệp vụ

### 3.1. Các vai trò

  -----------------------------------------------------------------------
  Vai trò                             Trách nhiệm chính
  ----------------------------------- -----------------------------------
  Guest                               Truy cập trang công khai, xem nội
                                      dung được phép xem, đăng ký/đăng
                                      nhập

  Student                             Học từ vựng, ngữ pháp, làm bài,
                                      dùng AI, theo dõi tiến độ

  Teacher                             Tạo và quản lý học liệu, bài tập,
                                      lớp học; đồng thời có thể học như
                                      Student

  Admin                               Quản trị tài khoản, vai trò, cấu
                                      hình và toàn hệ thống

  Reviewer (giai đoạn mở rộng)        Kiểm duyệt học liệu trước khi xuất
                                      bản
  -----------------------------------------------------------------------

### 3.2. Quy tắc phân quyền quan trọng

-   Guest không được truy cập dữ liệu học tập cá nhân.
-   Student chỉ xem/sửa hồ sơ và dữ liệu học tập của chính mình.
-   Teacher quản lý nội dung do mình tạo hoặc được giao; không mặc định
    có quyền sửa nội dung của mọi giáo viên.
-   Teacher có thể dùng chức năng học tập như Student.
-   Reviewer chỉ kiểm duyệt nội dung trong phạm vi được giao; không quản
    lý tài khoản hoặc cấu hình hệ thống.
-   Admin có quyền quản trị cao nhất, nhưng các thao tác nhạy cảm vẫn
    cần ghi log.
-   Backend phải kiểm tra quyền; ẩn nút trên giao diện không được xem là
    biện pháp bảo mật.
-   Nếu một người có nhiều vai trò, cần xác định rõ cách gán vai trò và
    cách chuyển ngữ cảnh sử dụng.

### 3.3. Ma trận quyền khái quát

  -----------------------------------------------------------------------------
  Nghiệp vụ           Guest      Student      Teacher     Reviewer        Admin
  ------------ ------------ ------------ ------------ ------------ ------------
  Xem nội dung           Có           Có           Có           Có           Có
  công khai                                                        

  Học từ          Không lưu           Có           Có Theo nhu cầu Theo nhu cầu
  vựng/ngữ          tiến độ                                        
  pháp                                                             

  Làm bài và          Không           Có           Có    Không bắt    Không bắt
  lưu kết quả                                                 buộc         buộc

  Dùng AI học         Không           Có           Có    Không bắt Quản trị cấu
  tập                                                         buộc         hình

  Xem tiến độ         Không     Của mình     Của mình        Không   Theo quyền
  cá nhân                                                              quản trị

  Tạo học liệu        Không        Không           Có        Không           Có

  Sửa học liệu        Không        Không   Trong phạm        Không           Có
                                         vi được giao              

  Gửi                 Không        Không    Gửi duyệt    Duyệt nội           Có
  duyệt/xuất                                                  dung 
  bản                                                              

  Quản lý lớp         Không Tham gia lớp     Lớp được        Không           Có
  học                                         quản lý              

  Quản lý tài         Không    Hồ sơ của        Không        Không           Có
  khoản                             mình                           

  Phân quyền          Không        Không        Không        Không           Có
  -----------------------------------------------------------------------------

Ma trận này là bản định hướng. Quyền chi tiết sẽ được chốt trong tài
liệu Use Case và thiết kế API.

------------------------------------------------------------------------

## 4. Lộ trình triển khai theo từng giai đoạn

> **Cách làm bắt buộc:** Chỉ thực hiện một giai đoạn tại một thời điểm.
> Khi hoàn thành, trình bày kết quả để người dùng review. Không tự động
> chuyển sang giai đoạn kế tiếp.

### Giai đoạn 0 --- Khởi tạo và thống nhất yêu cầu

**Mục tiêu:** Chốt phạm vi phiên bản đầu và cách làm việc trước khi
thiết kế sâu.

**Công việc** - Xác nhận mục tiêu và đối tượng sử dụng. - Chốt các vai
trò: Guest, Student, Teacher, Admin. - Quyết định Reviewer có nằm trong
MVP hay để giai đoạn mở rộng. - Chốt danh sách chức năng MVP và chức
năng chưa làm. - Xác nhận Tech Stack và phiên bản dự kiến. - Xác định
cách quản lý mã nguồn, nhánh Git và quy tắc đặt tên.

**Đầu ra** - Tài liệu yêu cầu phiên bản đầu. - Danh sách chức năng trong
MVP. - Danh sách chức năng để sau. - Tech Stack được xác nhận.

**Tiêu chí nghiệm thu** - Không còn chức năng cốt lõi chưa rõ mục
đích. - Vai trò và phạm vi MVP được thống nhất. - Người dùng xác nhận
tài liệu yêu cầu.

**Cổng review:** Dừng tại đây. Chỉ sang Giai đoạn 1 khi người dùng xác
nhận OK.

### Giai đoạn 1 --- Phân tích nghiệp vụ và Use Case

**Mục tiêu:** Làm rõ ai sử dụng hệ thống, họ được làm gì và luồng nghiệp
vụ diễn ra như thế nào.

**Công việc** - Liệt kê Actor. - Xây dựng Use Case tổng quát. - Phân rã
Use Case theo từng vai trò. - Mô tả luồng chính, luồng thay thế và
trường hợp lỗi. - Chốt quy tắc phân quyền và quyền sở hữu dữ liệu. - Mô
tả các quy trình: đăng ký/đăng nhập, học từ vựng, học ngữ pháp, làm bài,
dùng AI, tạo học liệu, duyệt học liệu và quản lý lớp.

**Đầu ra** - Sơ đồ Use Case tổng quát. - Đặc tả Use Case quan trọng. -
Ma trận phân quyền chi tiết. - Danh sách quy tắc nghiệp vụ.

**Tiêu chí nghiệm thu** - Mỗi chức năng có Actor và mục đích rõ ràng. -
Không có quyền chồng chéo hoặc cấp quyền không cần thiết. - Các luồng
chính và lỗi quan trọng đã được mô tả.

**Cổng review:** Người dùng kiểm tra nghiệp vụ và yêu cầu chỉnh sửa. Chỉ
sang Giai đoạn 2 khi được xác nhận.

### Giai đoạn 2 --- Thiết kế dữ liệu và API

**Mục tiêu:** Chuyển nghiệp vụ đã duyệt thành thiết kế kỹ thuật.

**Công việc** - Xác định collection MongoDB. - Thiết kế document, quan
hệ tham chiếu và embedded document. - Xác định index và quy tắc
unique. - Thiết kế DTO và validation. - Thiết kế REST API theo module. -
Quy định cấu trúc phản hồi, lỗi và phân trang. - Xác định API nào cần
xác thực và quyền nào cần kiểm tra.

**Đầu ra** - Sơ đồ dữ liệu/ERD hoặc document relationship diagram. -
Danh sách collection và trường dữ liệu. - Danh mục API endpoint. - Quy
ước response/error. - Tài liệu Swagger định hướng.

**Tiêu chí nghiệm thu** - Dữ liệu đáp ứng được các Use Case đã duyệt. -
Có quy tắc tránh trùng dữ liệu và truy cập sai quyền. - API không thiếu
luồng cốt lõi.

**Cổng review:** Review dữ liệu và API trước khi viết module backend.

### Giai đoạn 3 --- Khởi tạo dự án và nền tảng kỹ thuật

**Mục tiêu:** Tạo bộ khung chạy được cho frontend, backend và database.

**Công việc** - Khởi tạo Next.js App Router + TypeScript. - Khởi tạo
NestJS + TypeScript. - Kết nối MongoDB Atlas hoặc môi trường Docker đã
chọn. - Thiết lập biến môi trường và `.env.example`. - Thiết lập Git và
`.gitignore`. - Cấu hình Tailwind CSS, shadcn/ui và Lucide React. - Cấu
hình Swagger. - Kiểm tra frontend gọi được backend và backend kết nối
được database.

**Đầu ra** - Hai ứng dụng frontend/backend chạy được. - Kết nối database
thành công. - Swagger truy cập được. - Hướng dẫn chạy dự án trong
README.

**Tiêu chí nghiệm thu** - Máy phát triển có thể chạy dự án theo
README. - Không commit secret lên Git. - Có endpoint kiểm tra sức khỏe
cơ bản.

**Cổng review:** Kiểm tra cấu trúc thư mục, lệnh chạy và kết nối. Chưa
làm nghiệp vụ lớn nếu nền tảng chưa ổn định.

### Giai đoạn 4 --- Xác thực và phân quyền

**Mục tiêu:** Hoàn thiện nền tảng tài khoản và bảo vệ API.

**Công việc** - Đăng ký, đăng nhập, đăng xuất. - Băm và kiểm tra mật
khẩu bằng bcrypt. - Access Token và Refresh Token. - Xử lý hết hạn/đổi
token và thu hồi phiên phù hợp. - Guard xác thực. - Role-based access
control (RBAC). - Kiểm tra quyền sở hữu dữ liệu. - Admin quản lý tài
khoản và vai trò ở mức MVP.

**Đầu ra** - Luồng xác thực hoàn chỉnh. - API được bảo vệ theo vai
trò. - Kiểm thử quyền cho Guest, Student, Teacher và Admin.

**Tiêu chí nghiệm thu** - Người chưa đăng nhập không gọi được API riêng
tư. - Student không đọc/sửa dữ liệu của người khác. - Teacher không sửa
nội dung ngoài phạm vi. - Admin thực hiện được nghiệp vụ quản trị đã
thống nhất.

**Cổng review:** Kiểm thử các trường hợp được phép và bị từ chối. Chỉ
tiếp tục khi quyền hoạt động đúng.

### Giai đoạn 5 --- Module từ vựng (Vocabulary)

**Mục tiêu:** Hoàn thành luồng học từ vựng đầu tiên.

**Công việc** - Quản lý chủ đề từ vựng. - Quản lý từ, nghĩa, IPA, ví dụ
và loại từ. - Hiển thị danh sách và chi tiết từ. - Tìm kiếm/lọc theo chủ
đề và trình độ. - Flashcard cơ bản. - Phát âm bằng Web Speech API hoặc
audio phù hợp. - Lưu từ yêu thích hoặc từ cá nhân nếu nằm trong phạm vi
MVP.

**Đầu ra** - Teacher/Admin quản lý được dữ liệu từ vựng theo quyền. -
Student học và tra cứu được từ vựng. - Chức năng phát âm hoạt động trên
trình duyệt mục tiêu.

**Tiêu chí nghiệm thu** - Dữ liệu hiển thị đúng. - Tìm kiếm/lọc hoạt
động. - Không lộ chức năng quản trị cho Student. - Có xử lý khi từ chưa
có audio hoặc trình duyệt không hỗ trợ giọng đọc.

**Cổng review:** Kiểm tra trải nghiệm học một chủ đề từ đầu đến cuối.

### Giai đoạn 6 --- Module ngữ pháp (Grammar)

**Mục tiêu:** Cung cấp bài học ngữ pháp có cấu trúc và dễ ôn tập.

**Công việc** - Quản lý chủ điểm ngữ pháp. - Nội dung giải thích, cấu
trúc và ví dụ. - Phân loại trình độ/độ khó. - Danh sách bài học và trang
chi tiết. - Đánh dấu bài đã học. - Tìm kiếm/lọc chủ điểm.

**Đầu ra** - Teacher/Admin quản lý bài học. - Student xem và theo dõi
bài đã học.

**Tiêu chí nghiệm thu** - Nội dung dễ đọc, hiển thị đúng. - Quyền
tạo/sửa/xóa đúng vai trò. - Tiến độ bài học được lưu đúng tài khoản.

**Cổng review:** Review cấu trúc nội dung và trải nghiệm học trước khi
thêm bài tập.

### Giai đoạn 7 --- Bài tập và kiểm tra (Exercise/Quiz)

**Mục tiêu:** Đánh giá khả năng ghi nhớ từ vựng và hiểu ngữ pháp.

**Công việc** - Ngân hàng câu hỏi. - Loại câu hỏi MVP: trắc nghiệm và
điền từ. - Tạo bài kiểm tra theo chủ đề. - Student làm bài và nộp bài. -
Chấm điểm theo đáp án đã cấu hình. - Lưu kết quả và lịch sử làm bài. -
Teacher xem kết quả trong phạm vi lớp/nội dung được giao nếu chức năng
lớp đã có.

**Đầu ra** - Teacher tạo được bài kiểm tra. - Student làm và xem kết
quả. - Hệ thống lưu được lịch sử.

**Tiêu chí nghiệm thu** - Chấm điểm chính xác. - Không cho sửa đáp án
sau khi nộp nếu bài đã khóa. - Không lộ đáp án trước thời điểm phù
hợp. - Kết quả gắn đúng tài khoản và bài kiểm tra.

**Cổng review:** Kiểm thử nhiều trường hợp câu hỏi, đáp án và nộp bài.

### Giai đoạn 8 --- Tiến độ học tập và Spaced Repetition

**Mục tiêu:** Giúp người học biết mình đã học gì và cần ôn gì tiếp theo.

**Công việc** - Lưu lịch sử học và kết quả luyện tập. - Thống kê từ đã
học/đã nhớ/chưa nhớ theo quy tắc đã định. - Xây dựng lịch ôn tập đơn
giản. - Lưu lần ôn gần nhất và lần ôn tiếp theo. - Streak theo ngày có
hoạt động học hợp lệ. - Dashboard cá nhân và biểu đồ tiến độ cơ bản.

**Đầu ra** - Dashboard học tập. - Danh sách từ cần ôn. - Lịch sử và
thống kê cá nhân.

**Tiêu chí nghiệm thu** - Số liệu thống kê khớp với lịch sử thực tế. -
Không tính trùng hoạt động. - Lịch ôn được cập nhật đúng khi người học
trả lời. - Quy tắc Streak xử lý đúng ngày và múi giờ.

**Cổng review:** Đối chiếu dữ liệu mẫu và kết quả thống kê trước khi
tích hợp AI.

### Giai đoạn 9 --- Tích hợp AI học tập

**Mục tiêu:** Bổ sung trợ lý học tiếng Anh có phạm vi rõ ràng.

**Công việc** - Chọn mô hình hoặc nhà cung cấp API. - Xây dựng backend
service gọi AI; không để lộ API key ở frontend. - AI giải thích từ
vựng/ngữ pháp. - AI sửa câu và giải thích lỗi. - AI tạo câu ví dụ/bài
tập theo nội dung học. - Kiểm soát giới hạn lượt dùng và ghi nhận chi
phí. - Kiểm tra đầu ra, xử lý timeout và lỗi nhà cung cấp. - Lưu lịch sử
phù hợp, hạn chế lưu dữ liệu không cần thiết.

**Đầu ra** - Các chức năng AI đã chọn hoạt động qua backend. - Có giới
hạn sử dụng. - Có thông báo khi AI không phản hồi hoặc trả kết quả không
hợp lệ.

**Tiêu chí nghiệm thu** - AI trả lời đúng mục đích và định dạng mong
muốn. - Không lộ khóa API. - Có xử lý lỗi và giới hạn chi phí. - Có bộ
câu kiểm thử để đánh giá chất lượng.

**Cổng review:** Người dùng đánh giá chất lượng câu trả lời và chi phí
trước khi mở rộng tính năng AI.

### Giai đoạn 10 --- Giao diện Teacher, lớp học và kiểm duyệt mở rộng

**Mục tiêu:** Hoàn thiện quy trình quản lý nội dung và học viên.

**Công việc** - Teacher tạo và quản lý lớp. - Student tham gia lớp. -
Teacher giao bài tập. - Student nộp bài. - Teacher xem kết quả. - Bổ
sung trạng thái nội dung: Draft, Pending Review, Approved, Rejected,
Published. - Thêm Reviewer nếu phạm vi đồ án yêu cầu. - Ghi nhận lý do
từ chối và lịch sử duyệt.

**Đầu ra** - Luồng lớp học cơ bản. - Luồng tạo → gửi duyệt → xuất bản
học liệu. - Phân quyền theo lớp và quyền sở hữu nội dung.

**Tiêu chí nghiệm thu** - Student chỉ truy cập lớp mình tham gia. -
Teacher chỉ quản lý lớp được giao. - Nội dung chưa được duyệt không hiển
thị công khai nếu quy trình yêu cầu duyệt. - Có lịch sử trạng thái nội
dung.

**Cổng review:** Chốt xem các chức năng mở rộng có phù hợp thời gian đồ
án hay không.

### Giai đoạn 11 --- Kiểm thử, bảo mật và hoàn thiện giao diện

**Mục tiêu:** Kiểm tra toàn hệ thống trước khi bàn giao.

**Công việc** - Kiểm thử unit và integration cho các nghiệp vụ quan
trọng. - Kiểm thử quyền truy cập. - Kiểm thử validation và dữ liệu
biên. - Kiểm thử giao diện responsive. - Kiểm tra hiệu năng API và truy
vấn. - Kiểm tra lỗi bảo mật cơ bản. - Hoàn thiện loading, empty state và
error state. - Kiểm tra accessibility cơ bản. - Kiểm tra log và xử lý
lỗi.

**Đầu ra** - Danh sách test case và kết quả. - Danh sách lỗi và trạng
thái xử lý. - Bản ứng dụng ổn định để triển khai.

**Tiêu chí nghiệm thu** - Các luồng cốt lõi chạy được. - Không còn lỗi
nghiêm trọng đã biết. - Quyền truy cập được kiểm thử. - Giao diện dùng
được trên desktop và mobile.

**Cổng review:** Chỉ triển khai production khi các lỗi nghiêm trọng đã
được xử lý hoặc có phương án được chấp thuận.

### Giai đoạn 12 --- Triển khai và tài liệu báo cáo

**Mục tiêu:** Đưa sản phẩm lên môi trường demo và chuẩn bị bảo vệ đồ án.

**Công việc** - Chọn nơi triển khai frontend/backend phù hợp. - Cấu hình
biến môi trường production. - Cấu hình MongoDB Atlas và quyền truy cập
mạng. - Thiết lập domain/HTTPS nếu có. - Kiểm tra luồng production. -
Viết README hướng dẫn cài đặt và chạy. - Viết tài liệu kiến trúc, nghiệp
vụ và API. - Chuẩn bị tài khoản demo theo vai trò. - Chuẩn bị kịch bản
trình bày và dữ liệu minh họa.

**Đầu ra** - Website demo. - Mã nguồn và hướng dẫn chạy. - Tài liệu kỹ
thuật/nghiệp vụ. - Kịch bản demo và báo cáo đồ án.

**Tiêu chí nghiệm thu** - Website truy cập được trong môi trường demo. -
Tài khoản demo hoạt động đúng quyền. - Có thể trình bày các luồng nghiệp
vụ chính. - Tài liệu đủ để người khác cài đặt và kiểm tra.

**Cổng review cuối:** Đối chiếu sản phẩm với yêu cầu ban đầu và chốt
phiên bản bàn giao.

------------------------------------------------------------------------

## 5. Quy trình review bắt buộc sau mỗi giai đoạn

Sau khi hoàn thành một giai đoạn, báo cáo theo mẫu sau:

### Báo cáo hoàn thành giai đoạn

1.  **Mục tiêu:** Giai đoạn này cần giải quyết vấn đề gì?
2.  **Đã thực hiện:** Những đầu việc nào đã hoàn thành?
3.  **Sản phẩm bàn giao:** File, sơ đồ, API, màn hình hoặc chức năng nào
    đã có?
4.  **Cách kiểm tra:** Đã kiểm thử bằng cách nào? Kết quả ra sao?
5.  **Vấn đề còn tồn tại:** Lỗi, điểm chưa rõ hoặc quyết định cần người
    dùng đưa ra.
6.  **Đề xuất:** Có cần điều chỉnh kế hoạch không?
7.  **Trạng thái:** Chờ review / Cần chỉnh sửa / Đã được duyệt.

### Quy tắc chuyển giai đoạn

-   **Chờ review:** Không tự bắt đầu giai đoạn tiếp theo.
-   **Cần chỉnh sửa:** Chỉ xử lý các nội dung được yêu cầu chỉnh sửa
    trong giai đoạn hiện tại.
-   **Đã được duyệt:** Chỉ khi người dùng xác nhận rõ ràng mới chuyển
    tiếp.
-   Nếu thay đổi ảnh hưởng đến giai đoạn đã duyệt, phải nêu rõ ảnh hưởng
    và xin xác nhận trước khi sửa phạm vi.

### Mẫu xác nhận

-   `REVIEW`: Yêu cầu trình bày và kiểm tra kết quả giai đoạn hiện tại.
-   `CHỈNH SỬA: ...`: Nêu phần cần sửa.
-   `OK — TIẾP TỤC`: Duyệt giai đoạn hiện tại và cho phép bắt đầu giai
    đoạn tiếp theo.

------------------------------------------------------------------------

## 6. Quy ước kỹ thuật và làm việc

### 6.1. Cấu trúc module dự kiến

Backend NestJS có thể tổ chức theo module nghiệp vụ, ví dụ:

-   `auth`
-   `users`
-   `roles`
-   `vocabulary`
-   `topics`
-   `grammar`
-   `quizzes`
-   `learning-progress`
-   `ai-learning`
-   `classrooms`
-   `content-review`

Frontend Next.js tổ chức theo nhóm trang và thành phần dùng chung. Cấu
trúc thư mục chi tiết chỉ chốt ở Giai đoạn 3 sau khi thống nhất cách tổ
chức.

### 6.2. Quy tắc code

-   Dùng TypeScript ở frontend và backend.
-   Tách Controller, Service, DTO, Schema theo cấu trúc NestJS.
-   Không viết toàn bộ nghiệp vụ trong Controller.
-   Validate dữ liệu ở backend.
-   Không tin dữ liệu phân quyền do frontend gửi lên.
-   Không lưu secret trong mã nguồn.
-   Dùng tên biến/hàm rõ nghĩa và thống nhất.
-   Viết README cho cách cài đặt, chạy và kiểm thử.

### 6.3. Quy tắc Git đề xuất

-   `main`: phiên bản ổn định.
-   `develop`: nhánh tích hợp trong quá trình phát triển.
-   `feature/<ten-chuc-nang>`: nhánh cho từng chức năng.
-   Chỉ merge khi đã kiểm tra chức năng và không làm hỏng phần đã hoàn
    thành.

### 6.4. Nguyên tắc không mở rộng ngoài kế hoạch

Nếu phát hiện một ý tưởng mới: 1. Ghi vào danh sách Backlog. 2. Đánh giá
giá trị, độ khó và ảnh hưởng thời gian. 3. Không tự thêm vào giai đoạn
đang làm. 4. Chỉ đưa vào kế hoạch khi người dùng đồng ý.

------------------------------------------------------------------------

## 7. Trạng thái dự án

  Giai đoạn   Nội dung                              Trạng thái
  ----------- ------------------------------------- --------------
  0           Khởi tạo và thống nhất yêu cầu        Chưa bắt đầu
  1           Phân tích nghiệp vụ và Use Case       Chưa bắt đầu
  2           Thiết kế dữ liệu và API               Chưa bắt đầu
  3           Khởi tạo dự án và nền tảng kỹ thuật   Chưa bắt đầu
  4           Xác thực và phân quyền                Chưa bắt đầu
  5           Module từ vựng                        Chưa bắt đầu
  6           Module ngữ pháp                       Chưa bắt đầu
  7           Bài tập và kiểm tra                   Chưa bắt đầu
  8           Tiến độ và Spaced Repetition          Chưa bắt đầu
  9           Tích hợp AI                           Chưa bắt đầu
  10          Lớp học và kiểm duyệt mở rộng         Chưa bắt đầu
  11          Kiểm thử và hoàn thiện                Chưa bắt đầu
  12          Triển khai và tài liệu báo cáo        Chưa bắt đầu

**Trạng thái hiện tại: Giai đoạn 0 --- Chờ người dùng review và xác nhận
phạm vi.**

**Việc tiếp theo:** Review tài liệu tổng thể này, điều chỉnh Tech
Stack/phạm vi nếu cần, sau đó mới bắt đầu phân tích Use Case. Không tự
động triển khai các giai đoạn sau.
