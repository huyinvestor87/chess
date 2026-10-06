# Cờ Vua 3D Studio

Webapp đi cờ 3D (quân vàng/bạc kim loại, bàn phản chiếu) để **dựng video TikTok** về cờ vua.

## Chạy

Cần cài [Node.js](https://nodejs.org) (bản 20 trở lên).

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra (thường là http://localhost:5173) bằng **Chrome** hoặc **Edge**.

Muốn bản tĩnh để đưa lên web: `npm run build`, rồi upload thư mục `dist/`.

## Làm video trong 1 phút

1. Chọn **Ván mẫu** (ví dụ "Chiếu hết nhanh nhất: Fool's Mate"), hoặc dán PGN của bạn rồi bấm **Nạp**.
2. Chọn góc **Camera** (Phía Trắng / Điện ảnh / Từ trên…), sửa **Tiêu đề** nếu muốn.
3. Bấm **🎬 Quay tự động cả ván**: app tự về đầu, quay, đi hết ván, rồi tải file video về máy.
4. Đưa vào CapCut thêm nhạc, giọng đọc.

Video xuất đúng khung **1080×1920 (9:16)**, có sẵn tiêu đề, phụ đề, nước đi, âm thanh quân cờ.

Cũng có thể bấm **● Quay video** để tự quay trong lúc bạn đi quân/xoay camera bằng tay.
Bấm **H** để ẩn bảng điều khiển nếu bạn dùng phần mềm quay màn hình riêng (OBS…).

## Viết kịch bản bằng PGN

Chú thích trong `{ }` sẽ hiện thành **phụ đề** đúng lúc nước đi đó được đánh:

```
[Title "Ván cờ ngắn nhất có thể: chỉ 2 nước!"]
{Ván cờ kết thúc nhanh nhất lịch sử...}
1. f3 {Trắng làm hở đường chéo [%cal Re1h4]} e5
2. g4 {Sai lầm chết người! [%cal Rd8h4]} Qh4# {CHIẾU HẾT! [%csl Re1]}
```

- `[Title "..."]` → tiêu đề trên cùng video.
- `[%cal Gd8h4]` → vẽ mũi tên từ d8 tới h4 (G xanh lá, R đỏ, B xanh dương, Y vàng; nhiều mũi tên cách nhau dấu phẩy).
- `[%csl Re1]` → khoanh tròn ô e1.
- Thế cờ bắt đầu tuỳ ý: thêm `[FEN "..."]` và `[SetUp "1"]`.

Lichess/Chess.com xuất PGN có sẵn dạng này, nên có thể vẽ mũi tên trên Lichess Study rồi copy về.

## Điều khiển

| Thao tác | Tác dụng |
| --- | --- |
| Click quân → click ô | Đi quân (chế độ **Đúng luật** hoặc **Tự do**) |
| Chuột phải kéo | Vẽ mũi tên (Shift = đỏ, Alt = xanh dương, Ctrl = vàng) |
| Chuột phải 1 ô | Khoanh ô |
| Kéo chuột trái / lăn chuột | Xoay / zoom camera |
| ← → | Lùi / tiến nước |
| Space | Tự động đi |
| 1–5 | Đổi góc camera |
| F / H / R / P | Lật bàn / ẩn bảng / quay video / chụp ảnh |

Chế độ **Tự do** cho phép đi quân bất kỳ tới ô bất kỳ (minh hoạ cách đi của quân, mẹo, câu đố…).

## Thay quân bằng model AI

Quân cờ được dựng bằng code nên không cần file. Nếu muốn chi tiết hơn, tạo model bằng
Meshy/Tripo… theo prompt trong [PROMPTS.md](PROMPTS.md), lưu thành `public/models/knight.glb`
(hoặc `king.glb`, `queen.glb`, `rook.glb`, `bishop.glb`, `pawn.glb`). App tự nhận, tự căn
kích thước và phủ chất liệu vàng/bạc.

## Cấu trúc code

- `src/pieces.js` – dựng hình quân cờ (lathe), chất liệu kim loại, nạp model .glb
- `src/knight.js` – đầu ngựa điêu khắc bằng SDF + marching cubes
- `src/board.js` – bàn cờ phản chiếu, khung, mặt bàn
- `src/main.js` – logic ván cờ (chess.js), hoạt ảnh, camera, quay video
- `src/overlay.js` – chữ trên video (tiêu đề, phụ đề, "CHIẾU HẾT!")
- `src/samples.js` – các ván mẫu kèm chú thích tiếng Việt
