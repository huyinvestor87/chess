# Prompt cho các AI tool tạo hình

Webapp đã có sẵn bộ quân 3D dựng bằng code (vàng/bạc kim loại). Nếu muốn quân **đẹp hơn
nữa** (chi tiết điêu khắc như ảnh mẫu), dùng các prompt dưới đây với AI tạo model 3D,
rồi thả file vào `public/models/` là app tự dùng.

## 1. Tạo model 3D (Meshy, Tripo3D, Rodin/Hyper3D, Luma Genie…)

**Quy tắc chung khi xuất file**

- Định dạng **GLB**, một vật thể, **không cần texture** (app tự phủ chất liệu vàng/bạc).
- Đặt tên đúng: `king.glb`, `queen.glb`, `rook.glb`, `bishop.glb`, `knight.glb`, `pawn.glb`.
- Chép vào thư mục `public/models/`. App tự căn giữa, tự đặt lên mặt bàn, tự chỉnh chiều cao.
- Chọn mức "Medium/High poly", bật "smooth shading" và "symmetry" nếu tool có.
- Quân Mã: nên quay mặt về phía **+X** (bên phải khi nhìn từ trước). Nếu bị lệch hướng thì
  sửa `KNIGHT_YAW` trong `src/pieces.js`.

**Text-to-3D** (đổi `[QUÂN]` thành tên quân tiếng Anh: king / queen / rook / bishop / knight / pawn):

```
A single Staunton chess [QUÂN] piece, classic tournament design, polished solid metal,
smooth sculpted surfaces, elegant proportions, round weighted base with layered rings,
highly detailed, symmetrical, isolated object, no board, no background, clean topology,
watertight mesh, product render
```

Prompt riêng cho **quân Mã** (khó nhất, nên làm bằng AI nếu muốn đẹp như ảnh):

```
A single Staunton chess knight piece, realistic sculpted horse head facing sideways,
flowing carved mane with defined grooves, expressive eye, flared nostrils, open-mouth
detail, arched neck, round layered base with rings, polished metal, highly detailed,
isolated object, no background, watertight mesh, symmetrical base
```

Prompt cho **quân Vua** có thánh giá như ảnh:

```
A single Staunton chess king piece, tall elegant body, crown collar rings, cross pattée
finial on top, round layered base, polished metal, highly detailed sculpture, isolated,
no background, watertight mesh
```

Prompt cho **quân Hậu** có vương miện:

```
A single Staunton chess queen piece, slender tall body, coronet crown with 10 small
rounded points and a ball on top, layered collar rings, round base, polished metal,
isolated object, no background, watertight mesh
```

**Image-to-3D**: cắt riêng từng quân trong ảnh mẫu (nền trơn), đưa vào Meshy/Tripo chế độ
"Image to 3D". Kết quả thường giữ dáng tốt hơn text-to-3D.

## 2. Ảnh bìa / thumbnail TikTok (Midjourney, Ideogram, DALL·E, Leonardo…)

```
Luxury chess still life, gold and silver metal Staunton chess pieces on a black and
silver glossy chessboard, a fallen silver rook and knight in the foreground, mirror
reflections on black glass table, dramatic studio lighting, dark background, shallow
depth of field, cinematic, ultra detailed product photography, vertical 9:16
--ar 9:16 --style raw
```

Biến thể theo chủ đề video:

- **Chiếu hết**: `...a golden queen checkmating a fallen silver king, dramatic spotlight...`
- **Hy sinh Hậu**: `...a silver queen lying on its side, golden knight standing victorious...`
- **Lịch sử cờ vua**: `...antique chess pieces, old parchment map of Persia in the background, warm candle light...`

## 3. Nhạc nền / giọng đọc

- Giọng đọc tiếng Việt: ElevenLabs, FPT.AI, Vbee — prompt: *"giọng nam trầm, kể chuyện bí ẩn,
  tốc độ vừa"*.
- Nhạc nền (Suno/Udio): `dark cinematic piano, slow tension build, mysterious, 90 bpm, no vocals`.
