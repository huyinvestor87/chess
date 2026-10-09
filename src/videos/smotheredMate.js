// Đố Cờ #6 – Mã chiếu hết (chiếu hết ngạt thở). Thế cờ có đúng 1 nước chiếu hết: Nf7# (đã kiểm tra bằng chess.js).
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 32;
export const FEN = '3r2rk/pp4pp/8/2q3N1/8/1P6/P4PPP/3Q2K1 w - - 0 1';
export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'smothered-mate', name: 'Đố Cờ #6 – Mã chiếu hết', duration: D, coverTime: 1.6 },
  fen: FEN,
  moves: [{ san: 'Nf7#', t: 17.2, dur: 0.75 }],
  marks: [
    { t0: 8.8, t1: 12.4, squares: [['h8', 'R', 0.45]], blink: true },
    { t0: 9.8, t1: 12.4, squares: [['g8', 'Y', 0.45], ['g7', 'Y', 0.45], ['h7', 'Y', 0.45]] },
    { t0: 16.8, t1: 18.2, arrows: [['g5', 'f7', 'G']] },
    { t0: 18.3, t1: 22.4, squares: [['g8', 'R', 0.42], ['g7', 'R', 0.42], ['h7', 'R', 0.42]] },
  ],
  cam: standardCam(27.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 6, title: 'MÃ CHIẾU HẾT', sub: 'Trắng thắng ngay trong 1 nước?' });
    text(ctx, 'LUẬT CHƠI', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 8.6), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Trắng đi trước', W, H, 0.18, fade(t, 3.6, 8.6), u, { size: 52 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Trắng có 1 nước CHIẾU HẾT ngay lập tức!', W, H, 0.765, fade(t, 6.0, 8.6), u, { color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    text(ctx, 'GỢI Ý', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 8.7, 12.4), scale: pop(t, 8.7) }, u);
    captionBox(ctx, 'Vua đen ở góc h8 bị chính quân mình vây kín...', W, H, 0.765, fade(t, 8.9, 12.4), u);
    drawYourTurn(ctx, W, H, u, t, 12.5, 16.8, 13.8, 'Trắng chiếu hết trong 1 nước. Nước nào?');
    text(ctx, 'LỜI GIẢI', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 16.8, 18.0), scale: pop(t, 16.8) }, u);
    drawBang(ctx, W, H, u, t, 'CHIẾU HẾT!', 18.0, 22.4);
    captionBox(ctx, 'Mã f7 chiếu! Vua không còn ô nào để chạy', W, H, 0.765, fade(t, 18.4, 22.4), u, { color: '#ffd56a' });
    text(ctx, 'BẠN CÓ BIẾT?', W / 2, H * 0.1, { size: 64, weight: 900, gradient: GOLD_GRAD, alpha: fade(t, 22.5, 27.9), scale: pop(t, 22.5) }, u);
    captionBox(ctx, 'Kiểu này gọi là "chiếu hết ngạt thở": Vua bị chính quân mình chặn kín', W, H, 0.69, fade(t, 22.7, 27.9, 0.35, 0.4), u, { size: 48, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn tìm ra trong mấy giây? Comment nhé!', W, H, 0.8, fade(t, 23.9, 27.9, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 28.3, D + 1, 0.7, 0.805);
  },
});
