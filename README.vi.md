# Ứng Dụng Tạo Phụ Đề Một Nhấp Chuột

## Ảnh chụp màn hình

Dưới đây là một số ảnh chụp màn hình giới thiệu ứng dụng:

<div align="center">
  <table>
    <tr>
      <td><img src="readme_assets/Screenshot%202025-04-08%20195440.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20195622.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20195917.png" width="100%"></td>
    </tr>
    <tr>
      <td align="center"><strong>Giao diện sáng/tối với ngôn ngữ EN, VI, KO</strong></td>
      <td align="center"><strong>Tải lên video, âm thanh dài hoặc nguồn YouTube</strong></td>
      <td align="center"><strong>Xử lý song song với lựa chọn mô hình cho các lần thử lại</strong></td>
    </tr>
    <tr>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200056.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200132.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200147.png" width="100%"></td>
    </tr>
    <tr>
      <td align="center"><strong>Giao diện chỉnh sửa với điều khiển thời gian, chỉnh sửa văn bản và trực quan hóa</strong></td>
      <td align="center"><strong>Tùy chỉnh kiểu phụ đề và render video với phụ đề</strong></td>
      <td align="center"><strong>Cài đặt phụ đề với chế độ trong suốt và hỗ trợ toàn màn hình</strong></td>
    </tr>
    <tr>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200309.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200333.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200340.png" width="100%"></td>
    </tr>
    <tr>
      <td align="center"><strong>Dịch phụ đề sang bất kỳ ngôn ngữ nào mà vẫn giữ nguyên thời gian</strong></td>
      <td align="center"><strong>Thiết lập API, tích hợp OAuth, cập nhật ứng dụng và khôi phục cài đặt gốc</strong></td>
      <td align="center"><strong>Cấu hình thời lượng đoạn, lựa chọn mô hình và định dạng thời gian</strong></td>
    </tr>
    <tr>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200351.png" width="100%"></td>
      <td><img src="readme_assets/Screenshot%202025-04-08%20200358.png" width="100%"></td>
      <td></td>
    </tr>
    <tr>
      <td align="center"><strong>Các mẫu prompt và tùy chọn tùy chỉnh</strong></td>
      <td align="center"><strong>Quản lý bộ nhớ đệm và thông tin lưu trữ</strong></td>
      <td></td>
    </tr>
  </table>
</div>

Một ứng dụng web để tạo phụ đề có thời gian cho video sử dụng công nghệ Gemini AI của Google.

## Tính năng

- Tải lên tệp video hoặc cung cấp URL YouTube
- Tạo phụ đề có thời gian chính xác bằng Gemini AI
- Chỉnh sửa thời gian phụ đề với giao diện trực quan, dễ sử dụng
- Trực quan hóa dòng thời gian để điều chỉnh thời gian chính xác
- Tải xuống phụ đề ở định dạng SRT hoặc JSON
- Xem trước phụ đề trên video theo thời gian thực
- Hỗ trợ đa ngôn ngữ (Tiếng Anh, Tiếng Hàn, Tiếng Việt)
- Điều chỉnh thời gian liên kết cho sửa đổi hàng loạt
- Chức năng Hoàn tác/Đặt lại cho việc chỉnh sửa
- Xử lý song song cho video dài
- Gộp các dòng phụ đề liền kề chỉ với một cú nhấp
- Định dạng hiển thị thời gian tùy chỉnh (giây hoặc HH:MM:SS)
- Hiệu suất tối ưu cho video dài với nhiều phụ đề
- Chỉ báo tiến trình mượt mà, liên tục cho phụ đề hiện tại
- Chế độ tối mặc định với hỗ trợ cho chế độ sáng và tùy chọn theo hệ thống

## Điều kiện tiên quyết

- [Node.js](https://nodejs.org/) (v14 trở lên)
- [FFmpeg](https://ffmpeg.org/) (cần thiết cho xử lý video)
- Khóa API Google Gemini
- Khóa API Google YouTube (tùy chọn, cho chức năng tìm kiếm YouTube)

### Cài đặt cho Windows

#### Cài đặt đơn giản (sử dụng winget)

##### Cài đặt FFmpeg:
```powershell
winget install --id Gyan.FFmpeg -e --source winget --accept-package-agreements --accept-source-agreements
```

Kiểm tra cài đặt: Mở cửa sổ PowerShell hoặc Command Prompt MỚI và chạy:
```powershell
ffmpeg -version
```

##### Cài đặt Node.js:
```powershell
winget install --id OpenJS.NodeJS -e --source winget --accept-package-agreements --accept-source-agreements
```

QUAN TRỌNG: Đóng cửa sổ PowerShell hiện tại.
Mở cửa sổ PowerShell hoặc Command Prompt MỚI và kiểm tra cài đặt:
```powershell
node -v
npm -v
```

### Cài đặt cho macOS

#### Sử dụng Homebrew (Khuyên dùng)

Homebrew là trình quản lý gói cho macOS giúp việc cài đặt phần mềm trở nên dễ dàng.

##### Cài đặt Homebrew (nếu chưa cài đặt):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

##### Cài đặt Node.js:
```bash
brew install node
```

Kiểm tra cài đặt:
```bash
node -v
npm -v
```

##### Cài đặt FFmpeg:
```bash
brew install ffmpeg
```

Kiểm tra cài đặt:
```bash
ffmpeg -version
```

#### Cài đặt thủ công

##### Cài đặt Node.js:
1. Tải trình cài đặt macOS từ [trang web Node.js](https://nodejs.org/)
2. Chọn phiên bản LTS (Hỗ trợ dài hạn)
3. Chạy trình cài đặt và làm theo hướng dẫn
4. Kiểm tra cài đặt bằng cách mở Terminal và chạy:
   ```bash
   node -v
   npm -v
   ```

##### Cài đặt FFmpeg:
1. Tải FFmpeg từ [trang web FFmpeg](https://ffmpeg.org/download.html)
2. Giải nén tệp đã tải xuống
3. Di chuyển tệp nhị phân FFmpeg vào thư mục trong PATH của bạn, ví dụ:
   ```bash
   sudo mv ffmpeg /usr/local/bin/
   ```
4. Kiểm tra cài đặt:
   ```bash
   ffmpeg -version
   ```

## Cài đặt

1. Clone kho lưu trữ này hoặc tải xuống mã nguồn
2. Di chuyển đến thư mục dự án:

```bash
cd subtitles-generator
```

3. Cài đặt các phụ thuộc Node.js:
```bash
npm install
```

## Chạy ứng dụng

### Trên Windows và macOS

Để khởi động frontend + server đồng thời:

```bash
npm run dev
```

Điều này sẽ khởi chạy ứng dụng trong trình duyệt web mặc định của bạn.

### Xử lý sự cố

#### Các vấn đề phổ biến trên macOS

- **Vấn đề về quyền**: Nếu bạn gặp lỗi quyền với node_modules, hãy chạy:
  ```bash
  chmod -R 755 ./node_modules
  ```

- **Lỗi Node.js**: Nếu bạn gặp lỗi liên quan đến phiên bản Node.js, hãy thử sử dụng nvm (Node Version Manager) để cài đặt và sử dụng đúng phiên bản:
  ```bash
  nvm install 14
  nvm use 14
  ```

- **Không tìm thấy FFmpeg**: Đảm bảo FFmpeg được cài đặt đúng cách và nằm trong PATH của bạn:
  ```bash
  which ffmpeg
  ```
  Nếu không tìm thấy, hãy cài đặt lại bằng Homebrew: `brew reinstall ffmpeg`


## Cách sử dụng

1. **Chọn nguồn video**:
   - Tải lên tệp video trực tiếp
   - Cung cấp URL YouTube
   - Tìm kiếm video YouTube theo tiêu đề

2. **Tạo phụ đề**:
   - Nhấp vào nút "Tạo phụ đề có thời gian"
   - Đợi Gemini AI xử lý video/âm thanh
   - Xem lại phụ đề đã tạo

3. **Chỉnh sửa thời gian và văn bản** (nếu cần):
   - Sử dụng trực quan hóa dòng thời gian để điều chỉnh chính xác
   - Kéo điểm điều khiển thời gian phụ đề để điều chỉnh thời gian bắt đầu/kết thúc
   - Bật "Thời gian liên kết" để điều chỉnh tất cả phụ đề tiếp theo
   - Sử dụng "Hoàn tác" để hoàn nguyên thay đổi hoặc "Đặt lại" để bắt đầu lại
   - Nhấp vào bất kỳ văn bản phụ đề nào để chuyển đến mốc thời gian đó trong video
   - Chỉnh sửa văn bản phụ đề trực tiếp với nút chỉnh sửa
   - Xóa phụ đề không mong muốn hoặc thêm phụ đề trống mới
   - Gộp các dòng phụ đề liền kề với nút gộp

4. **Tải xuống phụ đề**:
   - Nhấp "Tải xuống SRT" cho định dạng phụ đề tiêu chuẩn
   - Nhấp "Tải xuống JSON" cho định dạng dữ liệu thô

## Cấu hình

Điều chỉnh cài đặt qua biểu tượng bánh răng ở góc trên bên phải:
- Thay đổi ngôn ngữ giao diện (Tiếng Việt là mặc định, cũng hỗ trợ Tiếng Anh và Tiếng Hàn)
- Quản lý cài đặt API (Gemini và YouTube)
- Chọn mô hình Gemini (Gemini 2.5 Pro là mặc định để đạt độ chính xác tốt nhất)
- Cấu hình thời lượng đoạn cho video dài (mặc định là 20 phút)
- Chọn định dạng hiển thị thời gian (HH:MM:SS là mặc định, hoặc giây)
- Xóa bộ nhớ đệm và quản lý lưu trữ

## Chi tiết kỹ thuật

- Xây dựng bằng React cho frontend
- Sử dụng Gemini AI của Google để tạo phụ đề
- Trực quan hóa dòng thời gian với HTML5 Canvas
- Hệ thống lưu trữ đệm hiệu quả cho phụ đề đã tạo
- Đồng bộ hóa phụ đề theo thời gian thực với phát lại video
- Render ảo hóa để tối ưu hiệu suất với video dài
- Xử lý song song để xử lý video dài hơn 15 phút
- Thiết kế đáp ứng hoạt động trên nhiều kích thước màn hình
- Hoạt ảnh được tăng tốc bởi phần cứng để trải nghiệm người dùng mượt mà

## Tối ưu hóa hiệu suất

- **Render ảo hóa**: Chỉ render các mục phụ đề có thể nhìn thấy, cải thiện đáng kể hiệu suất cho video dài
- **Giới hạn phân đoạn dòng thời gian**: Giới hạn thông minh số lượng phân đoạn được render trong trực quan hóa dòng thời gian
- **Điều tiết thao tác kéo**: Giảm độ trễ khi điều chỉnh thời gian phụ đề thông qua xử lý sự kiện hiệu quả
- **Tăng tốc phần cứng**: Sử dụng tăng tốc GPU cho hoạt ảnh và chuyển tiếp mượt mà
- **Đánh dấu thời gian thích ứng**: Điều chỉnh động số lượng đánh dấu thời gian dựa trên mức độ thu phóng
- **Cập nhật DOM hiệu quả**: Giảm thiểu việc render lại không cần thiết thông qua React memo và quản lý state cẩn thận
- **Hoạt ảnh liên tục**: Sử dụng requestAnimationFrame cho hoạt ảnh chỉ báo tiến trình mượt mà

## Giấy phép

Giấy phép MIT

Bản quyền (c) 2024 Subtitles Generator

Giấy phép này cho phép, miễn phí, cho bất kỳ người nào có được bản sao
của phần mềm này và các tệp tài liệu liên quan ("Phần mềm"), để xử lý
Phần mềm mà không có hạn chế, bao gồm nhưng không giới hạn quyền
sử dụng, sao chép, sửa đổi, hợp nhất, xuất bản, phân phối, cấp phép phụ và/hoặc bán
các bản sao của Phần mềm, và cho phép những người được cung cấp Phần mềm
làm như vậy, theo các điều kiện sau:

Thông báo bản quyền trên và thông báo cấp phép này phải được bao gồm trong tất cả
các bản sao hoặc phần quan trọng của Phần mềm.

PHẦN MỀM ĐƯỢC CUNG CẤP "NGUYÊN TRẠNG", KHÔNG CÓ BẢO HÀNH DƯỚI BẤT KỲ HÌNH THỨC NÀO, RÕ RÀNG HAY
NGỤ Ý, BAO GỒM NHƯNG KHÔNG GIỚI HẠN Ở CÁC BẢO HÀNH VỀ KHẢ NĂNG BÁN ĐƯỢC,
TÍNH PHÙ HỢP CHO MỘT MỤC ĐÍCH CỤ THỂ VÀ KHÔNG VI PHẠM. TRONG MỌI TRƯỜNG HỢP
CÁC TÁC GIẢ HOẶC NGƯỜI GIỮ BẢN QUYỀN SẼ KHÔNG CHỊU TRÁCH NHIỆM VỀ BẤT KỲ KHIẾU NẠI, THIỆT HẠI HOẶC
TRÁCH NHIỆM KHÁC, DÙ TRONG HÀNH ĐỘNG HỢP ĐỒNG, SAI PHẠM HOẶC HÌNH THỨC KHÁC, PHÁT SINH TỪ,
NGOÀI HOẶC LIÊN QUAN ĐẾN PHẦN MỀM HOẶC VIỆC SỬ DỤNG HOẶC CÁC GIAO DỊCH KHÁC TRONG
PHẦN MỀM.

## Lời cảm ơn

- Xây dựng với [React](https://reactjs.org/)
- Được hỗ trợ bởi [Google Gemini AI](https://deepmind.google/technologies/gemini/)
- Quốc tế hóa với [i18next](https://www.i18next.com/)
- Xử lý video với [FFmpeg](https://ffmpeg.org/)
- Trực quan hóa dòng thời gian sử dụng HTML5 Canvas
- Tích hợp YouTube với [@distube/ytdl-core](https://github.com/distubejs/ytdl-core) để tải video không cần server
- Phân tích cú pháp và tạo định dạng phụ đề SRT
- Biểu tượng từ [Heroicons](https://heroicons.com/)
- Ảo hóa với [react-window](https://github.com/bvaughn/react-window)
- Hoạt ảnh tối ưu với requestAnimationFrame