// Đố Cờ #10 – Ván cờ Opera (Morphy, Paris 1858): sau 15...Nxd7, Trắng chiếu hết trong 2 nước: 16. Qb8+ Nxb8 17. Rd8#
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 40;
const GAME = 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7'.split(' ');
const STEP = 0.42, G0 = 3.6;
const moves = GAME.map((san, i) => ({ san, t: G0 + i * STEP, dur: 0.32 }));
moves.push({ san: 'Qb8+', t: 21.4, dur: 0.7 }, { san: 'Nxb8', t: 22.7, dur: 0.6 }, { san: 'Rd8#', t: 23.6, dur: 0.7 });
const G1 = G0 + GAME.length * STEP; // 16.2

export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'opera-game', name: 'Đố Cờ #10 – Ván cờ Opera', duration: D, coverTime: 1.6 },
  moves,
  marks: [
    { t0: 21.0, t1: 22.2, arrows: [['b3', 'b8', 'G']] },
    { t0: 22.8, t1: 24.3, arrows: [['d1', 'd8', 'G']] },
    { t0: 24.4, t1: 28.6, arrows: [['g5', 'd8', 'Y']] },
  ],
  cam: standardCam(35.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 10, title: 'VÁN CỜ OPERA', sub: 'Morphy chiếu hết trong 2 nước?' });
    const gA = fade(t, 3.3, G1 + 0.2);
    text(ctx, 'PARIS, 1858', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: gA, scale: pop(t, 3.3) }, u);
    if (gA > 0) {
      const n = Math.max(1, Math.min(15, Math.floor((t - G0) / STEP / 2) + 1));
      text(ctx, `Nước ${n}`, W / 2, H * 0.16, { size: 52, weight: 800, alpha: gA }, u);
    }
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Morphy (Trắng) vừa xem nhạc kịch vừa đánh cờ', W, H, 0.765, fade(t, 6.0, 10.6), u);
    captionBox(ctx, 'Thí Mã, thí Xe để mở đường tấn công!', W, H, 0.765, fade(t, 10.6, 14.0), u, { color: '#ffd56a' });
    captionBox(ctx, 'Vua đen vẫn kẹt ở giữa bàn...', W, H, 0.765, fade(t, 14.0, G1 + 0.2), u);
    drawYourTurn(ctx, W, H, u, t, G1 + 0.3, 21.0, 18.2, 'Trắng chiếu hết trong 2 nước. Gợi ý: thí Hậu!');
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 21.0, 24.3), scale: pop(t, 21.0) }, u);
    captionBox(ctx, 'Thí Hậu!! Chiếu Vua', W, H, 0.765, fade(t, 21.4, 22.7), u, { color: '#ffd56a' });
    captionBox(ctx, 'Mã đen buộc phải ăn Hậu...', W, H, 0.765, fade(t, 22.7, 24.3), u);
    drawBang(ctx, W, H, u, t, 'CHIẾU HẾT!', 24.4, 28.6);
    captionBox(ctx, 'Xe d8 chiếu hết, có Tượng g5 yểm trợ', W, H, 0.765, fade(t, 24.8, 28.6), u, { color: '#ffd56a' });
    text(ctx, 'BẠN CÓ BIẾT?', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 28.7, 35.9), scale: pop(t, 28.7) }, u);
    captionBox(ctx, 'Ván Opera là một trong những ván cờ nổi tiếng nhất lịch sử', W, H, 0.69, fade(t, 28.9, 35.9, 0.35, 0.4), u, { size: 50, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn có thấy nước thí Hậu không? Comment nhé!', W, H, 0.8, fade(t, 30.1, 35.9, 0.35, 0.4), u, { size: 44 });
    drawFollow(ctx, W, H, u, t, 36.3, D + 1, 0.7, 0.805);
  },
});
