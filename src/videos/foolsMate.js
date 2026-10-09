// Đố Cờ #4 – Fool's Mate: chiếu hết sau 2 nước (1. f3 e5 2. g4 Qh4#), đã kiểm tra bằng chess.js.
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 30;
export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'fools-mate', name: "Đố Cờ #4 – Chiếu hết sau 2 nước", duration: D, coverTime: 1.6 },
  moves: [
    { san: 'f3', t: 6.2 },
    { san: 'e5', t: 7.4 },
    { san: 'g4', t: 8.6 },
    { san: 'Qh4#', t: 15.0, dur: 0.7 },
  ],
  marks: [
    { t0: 9.4, t1: 10.4, squares: [['f2', 'R', 0.35], ['g3', 'R', 0.35], ['h4', 'R', 0.35]], blink: true },
    { t0: 14.6, t1: 17.2, arrows: [['d8', 'h4', 'G']] },
    { t0: 16.0, t1: 19.6, arrows: [['h4', 'e1', 'R']], squares: [['g3', 'R', 0.4], ['f2', 'R', 0.4]] },
  ],
  cam: standardCam(25.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 4, title: 'CHIẾU HẾT\nSAU 2 NƯỚC', titleSize: 108, sub: 'Ván cờ ngắn nhất có thể!' });
    text(ctx, 'XEM KỸ NHÉ', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 10.2), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Trắng đi 2 nước... rất tệ', W, H, 0.18, fade(t, 3.6, 10.2), u, { size: 52 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, '1. Trắng đẩy Tốt f3', W, H, 0.765, fade(t, 6.0, 7.4), u);
    captionBox(ctx, 'Đen đẩy Tốt e5', W, H, 0.765, fade(t, 7.4, 8.6), u);
    captionBox(ctx, '2. Trắng đẩy tiếp Tốt g4?!', W, H, 0.765, fade(t, 8.6, 10.2), u, { color: '#ff8a80' });
    drawYourTurn(ctx, W, H, u, t, 10.3, 14.6, 11.6, 'Đen chiếu hết trong 1 nước. Nước nào?');
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 14.6, 15.8), scale: pop(t, 14.6) }, u);
    drawBang(ctx, W, H, u, t, 'CHIẾU HẾT!', 15.8, 20.0);
    captionBox(ctx, 'Hậu h4! Vua trắng không còn đường thoát', W, H, 0.765, fade(t, 16.2, 19.8), u, { color: '#ffd56a' });
    text(ctx, 'BẠN CÓ BIẾT?', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 20.0, 26.0), scale: pop(t, 20.0) }, u);
    captionBox(ctx, "Đây là Fool's Mate – ván cờ ngắn nhất có thể: chỉ 2 nước!", W, H, 0.69, fade(t, 20.2, 26.0, 0.35, 0.4), u, { size: 50, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn từng thắng (hay thua) kiểu này chưa? Comment nhé!', W, H, 0.8, fade(t, 21.4, 26.0, 0.35, 0.4), u, { size: 44 });
    drawFollow(ctx, W, H, u, t, 26.3, D + 1, 0.7, 0.805);
  },
});
