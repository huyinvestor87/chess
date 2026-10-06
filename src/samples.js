// Ván mẫu cho video "sự thật thú vị về cờ vua".
// Chú thích trong { } sẽ hiện thành phụ đề. [%cal Ge2e4] = mũi tên, [%csl Rd4] = khoanh ô
// (G = xanh lá, R = đỏ, B = xanh dương, Y = vàng).
export const SAMPLES = [
  {
    name: "Chiếu hết nhanh nhất: Fool's Mate (2 nước)",
    pgn: `[Title "Ván cờ ngắn nhất có thể: chỉ 2 nước!"]
{Ván cờ kết thúc nhanh nhất trong lịch sử cờ vua...}
1. f3 {Trắng làm hở đường chéo trước Vua [%cal Re1h4]} e5
2. g4 {Một sai lầm chết người! [%cal Rd8h4]} Qh4# {CHIẾU HẾT chỉ sau 2 nước! [%csl Re1]} 0-1`,
  },
  {
    name: "Scholar's Mate – Chiếu hết 4 nước",
    pgn: `[Title "Bẫy 4 nước mà người mới hay dính"]
{Bạn có biết: đây là cái bẫy phổ biến nhất với người mới chơi}
1. e4 e5 2. Qh5 {Hậu ra sớm, nhắm vào ô f7 [%cal Gh5f7]} Nc6
3. Bc4 {Tượng cũng nhắm f7! [%cal Gc4f7,Gh5f7] [%csl Rf7]} Nf6
4. Qxf7# {Chiếu hết! Ô f7 chỉ có Vua bảo vệ} 1-0`,
  },
  {
    name: 'Bẫy Légal (1750) – Hy sinh Hậu',
    pgn: `[Title "Bỏ Hậu để chiếu hết – Bẫy Légal"]
{Một cái bẫy hơn 270 năm tuổi}
1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 {Đen ghim Mã vào Hậu [%cal Gg4d1]}
4. Nc3 g6 5. Nxe5 {Trắng thí Hậu!?} Bxd1 {Đen ăn Hậu... [%csl Re5]}
6. Bxf7+ {Chiếu!} Ke7 7. Nd5# {Chiếu hết bằng 3 quân nhẹ! [%csl Re7]} 1-0`,
  },
  {
    name: 'Ván cờ Opera – Morphy 1858',
    pgn: `[Title "Ván cờ Opera – Paul Morphy, Paris 1858"]
{Morphy chơi ván này trong lúc xem nhạc kịch tại nhà hát Opera Paris}
1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6
7. Qb3 {Tấn công kép f7 và b7 [%cal Gb3f7,Gb3b7]} Qe7 8. Nc3 c6 9. Bg5 b5
10. Nxb5 {Thí Mã!} cxb5 11. Bxb5+ Nbd7 12. O-O-O {Nhập thành, Xe vào trận} Rd8
13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7
16. Qb8+ {Thí Hậu!!} Nxb8 17. Rd8# {Chiếu hết – một kiệt tác} 1-0`,
  },
  {
    name: 'Ván cờ Bất tử – Anderssen 1851',
    pgn: `[Title "Ván cờ Bất tử – Anderssen vs Kieseritzky 1851"]
{Trắng thí cả 2 Xe, 1 Tượng và Hậu để chiếu hết!}
1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5
8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 {Thí Xe thứ nhất} cxb5 12. h4 Qg6
13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2
18. Bd6 {Thí tiếp Xe thứ hai!} Bxg1 19. e5 Qxa1+ 20. Ke2 Na6
21. Nxg7+ Kd8 22. Qf6+ {Thí cả Hậu!!} Nxf6 23. Be7# {Chiếu hết!} 1-0`,
  },
  {
    name: 'Luật lạ: Bắt tốt qua đường (En passant)',
    pgn: `[Title "Luật cờ vua mà 90% người mới không biết"]
{Tốt có thể ăn một quân... không đứng ở ô nó ăn!}
1. e4 Nf6 2. e5 d5 {Tốt đen đi 2 ô, đứng ngay cạnh tốt trắng [%csl Gd5,Ge5]}
3. exd6 {Bắt tốt qua đường! Tốt trắng ăn chéo vào d6 [%cal Ge5d6]} *`,
  },
  {
    name: 'Nhập thành – Vua đi 2 ô',
    pgn: `[Title "Nước đi duy nhất mà 2 quân cùng di chuyển"]
1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 {Đường giữa Vua và Xe đã trống [%csl Gf1,Gg1]}
4. O-O {Nhập thành: Vua đi 2 ô, Xe nhảy qua [%cal Ge1g1,Gh1f1]} *`,
  },
  {
    name: 'Phong cấp – Tốt hoá Hậu',
    pgn: `[Title "Tốt nhỏ bé có thể hoá thành Hậu"]
[FEN "8/4P3/8/8/8/2k5/8/4K3 w - - 0 1"]
[SetUp "1"]
{Tốt đi đến hàng cuối cùng... [%cal Ge7e8]}
1. e8=Q {...và trở thành Hậu! Về lý thuyết có thể có tới 9 Hậu trên bàn} *`,
  },
];
