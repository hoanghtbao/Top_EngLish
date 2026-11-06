---
name: agile-scrum-management
description: Quy chuẩn và hướng dẫn quản lý dự án phần mềm theo mô hình Agile/Scrum (Sprint, User Stories, Product Backlog, Daily Standup, Sprint Review, Retrospective, DoD, DoR, Estimation).
---

# QUY TRÌNH QUẢN LÝ DỰ ÁN THEO PHƯƠNG PHÁP AGILE / SCRUM

Tài liệu này cung cấp khung làm việc (framework), quy trình thực thi và biểu mẫu chuẩn để vận hành và quản lý dự án công nghệ theo phương pháp Scrum & Agile.

---

## 1. CÁC VAI TRÒ CỐT LÕI (SCRUM ROLES)

1. **Product Owner (PO)**:
   - Đại diện cho người dùng cuối và các bên liên quan (Stakeholders).
   - Quản lý, sắp xếp độ ưu tiên của **Product Backlog**.
   - Định nghĩa rõ ràng mục tiêu tính năng và tiêu chí nghiệm thu (**Acceptance Criteria**).
   - Quyết định chấp nhận hay từ chối kết quả bàn giao ở cuối mỗi Sprint.

2. **Scrum Master (SM)**:
   - Đảm bảo quy trình Scrum được vận hành trơn tru và tuân thủ đúng nguyên tắc.
   - Tháo gỡ các trở ngại, rào cản kỹ thuật và phi kỹ thuật (**Impediments / Blockers**) cho team.
   - Điều phối các buổi lễ Scrum (Ceremonies) đạt hiệu quả cao, đúng thời lượng (Timeboxing).
   - Thúc đẩy văn hóa minh bạch, trao quyền và cải tiến liên tục.

3. **Development Team (Frontend, Backend, Fullstack, QA, UI/UX)**:
   - Đa chức năng (Cross-functional) và tự tổ chức (Self-organizing).
   - Chịu trách nhiệm phân tích, ước lượng, thiết kế kiến trúc, viết code, kiểm thử và bàn giao sản phẩm tăng trưởng (**Shippable Increment**).
   - Đảm bảo chất lượng sản phẩm tuân theo bộ quy chuẩn kỹ thuật của dự án.

---

## 2. CÁC SỰ KIỆN SCRUM (SCRUM CEREMONIES)

Chu kỳ lặp của dự án được tổ chức theo các **Sprint** (thời lượng khuyến nghị: 1 - 2 tuần/Sprint).

| Sự kiện | Thời lượng khuyến nghị | Mục tiêu cốt lõi |
| :--- | :--- | :--- |
| **Sprint Planning** | 1 - 2 giờ (cho sprint 1-2 tuần) | Xác định **Sprint Goal**, chọn các User Story ưu tiên từ Product Backlog đưa vào Sprint Backlog, chia nhỏ thành các Task kỹ thuật. |
| **Daily Scrum / Standup** | 10 - 15 phút (đầu ngày làm việc) | Đồng bộ tiến độ nhanh với 3 câu hỏi chính: <br>1. Hôm qua tôi đã làm gì?<br>2. Hôm nay tôi sẽ làm gì?<br>3. Có rào cản/khó khăn (blocker) nào không? |
| **Backlog Refinement** | 45 - 60 phút (giữa sprint) | Làm mịn và phân tích các User Story sắp tới, làm rõ yêu cầu, bổ sung Acceptance Criteria, đánh giá lại Story Points. |
| **Sprint Review / Demo** | 30 - 45 phút (cuối sprint) | Trình chiếu sản phẩm thực tế (Increment) đã đạt tiêu chuẩn Done cho PO và các bên liên quan kiểm tra và nhận feedback. |
| **Sprint Retrospective** | 30 - 45 phút (sau Sprint Review) | Cả đội ngũ nhìn nhận lại quy trình: <br>- *Điểm làm tốt (What went well)*<br>- *Điểm cần cải thiện (What needs improvement)*<br>- *Kế hoạch hành động cụ thể (Action Items)*. |

---

## 3. TIÊU CHUẨN USER STORY & TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

### 3.1. Nguyên tắc INVEST cho User Story
Mỗi User Story phải đảm bảo:
- **I**ndependent: Độc lập, không bị ràng buộc phụ thuộc chéo vào story khác nếu có thể.
- **N**egotiable: Có thể thương lượng và điều chỉnh phạm vi.
- **V**aluable: Đem lại giá trị thực tế cho người dùng hoặc hệ thống.
- **E**stimable: Đội ngũ có thể ước lượng được độ phức tạp.
- **S**mall: Đủ nhỏ để hoàn thành trọn vẹn trong một Sprint (thường từ 1 đến 8 Story Points).
- **T**estable: Có thể kiểm thử và xác nhận đạt yêu cầu.

### 3.2. Cấu trúc chuẩn của một User Story
```markdown
**ID**: US-[Số hiệu] (Ví dụ: US-101)
**Tên Story**: [Tên ngắn gọn của tính năng]

**Mô tả (Format)**:
Là một [Đối tượng người dùng / Role]
Tôi muốn [Thực hiện hành động hoặc có tính năng X]
Để [Đạt được giá trị hoặc giải quyết vấn đề Y]

**Tiêu chí nghiệm thu (Acceptance Criteria - BDD Format)**:
- Kịch bản 1: [Tên kịch bản thành công]
  - GIVEN (Cho trước): [Bối cảnh / Điều kiện ban đầu]
  - WHEN (Khi): [Người dùng thực hiện hành vi]
  - THEN (Thì): [Kết quả mong đợi, dữ liệu trả về, UI cập nhật]

- Kịch bản 2: [Tên kịch bản lỗi / ngoại lệ]
  - GIVEN: [Bối cảnh]
  - WHEN: [Hành vi không hợp lệ]
  - THEN: [Hiển thị thông báo lỗi thân thiện, giữ an toàn dữ liệu]
```

---

## 4. TIÊU CHÍ SẴN SÀNG (DoR) & HOÀN THÀNH (DoD)

### 4.1. Definition of Ready (DoR) - Điều kiện để đưa Story vào Sprint
Một User Story chỉ được đưa vào Sprint khi thỏa mãn:
1. Có User Story rõ ràng theo cấu trúc chuẩn.
2. Có đầy đủ danh sách Acceptance Criteria (AC) bao gồm cả trường hợp thành công và lỗi ngoại lệ.
3. Đã có thiết kế UI/UX (Figma/Wireframe) nếu có giao diện Frontend.
4. Đã xác định rõ đặc tả API / Luồng dữ liệu (Data flow) nếu liên quan đến Backend.
5. Đã được toàn đội ước lượng Story Points (không vượt quá 8 points).
6. Không bị phụ thuộc (block) bởi các task chưa hoàn thành từ Sprint trước.

### 4.2. Definition of Done (DoD) - Điều kiện để nghiệm thu và đóng Story
Một User Story chỉ được đánh dấu là **Done** khi:
1. Toàn bộ mã nguồn đáp ứng đúng tiêu chuẩn dự án (`top-english-standards`):
   - Có JSDoc thông tin tác giả, mô tả method `@param`, `@returns`.
   - Comment tiếng Việt giải thích rõ ràng các logic phức tạp, thuật toán, bảo mật.
   - Backend tuân thủ module hóa, không sử dụng `any`, validate DTO 100%, chuẩn hóa JSON response.
   - Frontend responsive, mượt mà trên Desktop/Mobile, màu sắc chuẩn, tương thích Dark/Light mode.
2. Đã viết Unit Test / Integration Test cho các logic nghiệp vụ quan trọng (Streak, Quiz, JWT).
3. Đã tạo Pull Request (PR), vượt qua vòng Code Review của đồng đội và được merge vào branch chính.
4. Triển khai và chạy thử nghiệm thành công trên môi trường Staging/Dev không phát sinh lỗi nghiêm trọng.
5. Swagger `/api/docs` và tài liệu liên quan được cập nhật đầy đủ.
6. PO đã nghiệm thu trực tiếp và xác nhận đạt tất cả Acceptance Criteria.

---

## 5. ƯỚC LƯỢNG & ĐO LƯỜNG TIẾN ĐỘ (ESTIMATION & METRICS)

1. **Ước lượng độ phức tạp (Story Points)**:
   - Sử dụng dãy số Fibonacci: `1, 2, 3, 5, 8, 13, 21`.
   - **1 Point**: Task đơn giản, thay đổi nhỏ (sửa text, chỉnh CSS cơ bản, 1 API get đơn giản).
   - **2 - 3 Points**: Tính năng có logic vừa phải, form nhập liệu có validate, CRUD cơ bản.
   - **5 - 8 Points**: Tính năng phức tạp (thuật toán lặp lại ngắt quãng, chấm điểm quiz, xác thực JWT & Guards).
   - **>= 13 Points**: Quá lớn -> **BẮT BUỘC PHẢI PHÂN RÃ (Split)** thành 2 hay nhiều User Story nhỏ hơn.

2. **Vận tốc Sprint (Sprint Velocity)**:
   - Tổng số Story Points hoàn thành thực tế trong một Sprint.
   - Dùng chỉ số trung bình của 2-3 Sprint gần nhất để ước tính khối lượng công việc cho Sprint kế tiếp.

3. **Biểu đồ Burndown (Burndown Chart)**:
   - Theo dõi số lượng Story Points hoặc số giờ làm việc còn lại mỗi ngày trong Sprint để phát hiện sớm nguy cơ trễ hạn.

---

## 6. QUY TRÌNH PHỐI HỢP KANBAN BOARD & GIT WORKFLOW

### 6.1. Các trạng thái trên Kanban / Scrum Board
Mọi Task kỹ thuật phải nằm trong 1 trong các cột:
1. `Backlog`: Danh sách yêu cầu đang chờ chuẩn bị DoR.
2. `To Do`: Các công việc trong Sprint hiện tại sẵn sàng thực hiện.
3. `In Progress`: Đang được lập trình viên thực hiện (mỗi người tối đa 1-2 task cùng lúc để tránh phân mảnh tư duy).
4. `Code Review / PR`: Đã mở Pull Request, chờ đồng đội review code.
5. `Testing / QA`: Đã merge vào branch dev, đang kiểm thử tính năng theo Acceptance Criteria.
6. `Done`: Hoàn tất mọi tiêu chí trong Definition of Done.

### 6.2. Quy tắc đặt tên Branch trong Git
- **Feature**: `feature/US-[id]-[tên-tính-năng-ngắn-gọn]` (Ví dụ: `feature/US-101-spaced-repetition`)
- **Bugfix**: `fix/BUG-[id]-[tên-lỗi]` (Ví dụ: `fix/BUG-202-streak-reset-tz`)
- **Refactor / Perf**: `refactor/[tên-task]` (Ví dụ: `refactor/optimize-quiz-aggregation`)
- **Hotfix (Môi trường Production)**: `hotfix/[tên-lỗi-khẩn-cấp]`

### 6.3. Quy tắc Commit chuẩn (Conventional Commits)
- `feat(US-[id]): [mô tả ngắn bằng tiếng Anh/Việt]`
- `fix(BUG-[id]): [mô tả ngắn về lỗi đã sửa]`
- `refactor: [mô tả tái cấu trúc mã nguồn]`
- `test: [mô tả bổ sung test case]`
- `docs: [mô tả cập nhật tài liệu]`

---

## 7. TÀI NGUYÊN & BIỂU MẪU KÈM THEO
- Template viết User Story & Task phân rã: `resources/user-story-template.md`
- Biên bản họp Sprint Planning & Retrospective: `resources/sprint-ceremonies.md`
