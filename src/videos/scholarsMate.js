// Đố Cờ #5 – Bẫy 4 nước (Scholar's Mate): 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6?? 4. Qxf7#
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 34;
export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'scholars-mate', name: 'Đố Cờ #5 – Bẫy 4 nước', duration: D, coverTime: 1.6 },
  moves: [
    { san: 'e4', t: 6.2 },
    { san: 'e5', t: 7.0 },
    { san: 'Qh5', t: 7.9 },
    { san: 'Nc6', t: 9.0 },
    { san: 'Bc4', t: 10.0 },
    { san: 'Nf6', t: 11.4 },
    { san: 'Qxf7#', t: 17.8, dur: 0.65 },
  ],
  marks: [
    { t0: 8.5, t1: 13.0, arrows: [['h5', 'f7', 'R']] },
    { t0: 10.6, t1: 13.0, arrows: [['c4', 'f7', 'R']], squares: [['f7', 'R', 0.45]], blink: true },
    { t0: 11.9, t1: 13.0, arrows: [['f6', 'h5', 'Y']] },
    { t0: 17.3, t1: 18.5, arrows: [['h5', 'f7', 'G']] },
    { t0: 18.6, t1: 22.8, arrows: [['c4', 'f7', 'G']] },
  ],
  cam: standardCam(29.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 5, title: 'BẪY 4 NƯỚC', sub: 'Cái bẫy người mới hay dính nhất!' });
    text(ctx, 'XEM KỸ NHÉ', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 13.0), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Trắng đang giăng bẫy...', W, H, 0.18, fade(t, 3.6, 13.0), u, { size: 52 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Mở đầu: Tốt e4 – Tốt e5', W, H, 0.765, fade(t, 6.0, 7.9), u);
    captionBox(ctx, 'Hậu trắng ra sớm, nhắm vào ô f7', W, H, 0.765, fade(t, 7.9, 10.0), u, { color: '#ff8a80' });
    captionBox(ctx, 'Tượng cũng nhắm vào f7!', W, H, 0.765, fade(t, 10.0, 11.4), u, { color: '#ff8a80' });
    captionBox(ctx, 'Đen ra Mã f6 để đuổi Hậu...', W, H, 0.765, fade(t, 11.4, 13.0), u);
    drawYourTurn(ctx, W, H, u, t, 13.1, 17.4, 14.4, 'Trắng chiếu hết trong 1 nước. Tìm đi!');
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 17.4, 18.5), scale: pop(t, 17.4) }, u);
    drawBang(ctx, W, H, u, t, 'CHIẾU HẾT!', 18.5, 22.8);
    captionBox(ctx, 'Hậu ăn f7, có Tượng c4 yểm trợ. Vua không ăn lại được!', W, H, 0.765, fade(t, 18.9, 22.8), u, { color: '#ffd56a' });
    text(ctx, 'CÁCH TRÁNH BẪY', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 22.9, 29.9), scale: pop(t, 22.9) }, u);
    captionBox(ctx, 'Nếu cầm quân Đen: đi Hậu e7 hoặc Tốt g6 để chặn trước!', W, H, 0.69, fade(t, 23.1, 29.9, 0.35, 0.4), u, { size: 50, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn từng dính bẫy này chưa? Comment nhé!', W, H, 0.8, fade(t, 24.4, 29.9, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 30.3, D + 1, 0.7, 0.805);
  },
});
