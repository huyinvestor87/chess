// Đố Cờ #9 – Nhập thành: Tượng đen a6 khống chế f1 nên Trắng KHÔNG được nhập thành (chess.js: O-O không hợp lệ, Trắng không bị chiếu).
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang, drawChoices } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 34;
const REVEAL = 15.6;
export const FEN = 'rn1qk2r/ppp2ppp/b4n2/2bpp3/3PP3/2N2N2/PPP2PPP/R1BQK2R w KQkq - 0 1';
export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'castling', name: 'Đố Cờ #9 – Nhập thành', duration: D, coverTime: 1.6 },
  fen: FEN,
  tries: [{ from: 'e1', to: 'f1', t: 16.0, dur: 0.5, hold: 1.5 }],
  marks: [
    { t0: 6.2, t1: 10.0, arrows: [['e1', 'g1', 'G'], ['h1', 'f1', 'B']] },
    { t0: 7.4, t1: 10.0, squares: [['f1', 'G', 0.35], ['g1', 'G', 0.35]] },
    { t0: 16.4, t1: 21.4, arrows: [['a6', 'f1', 'R']] },
    { t0: 16.6, t1: 21.4, squares: [['f1', 'R', 0.55]], blink: true },
  ],
  cam: standardCam(29.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 9, title: 'NHẬP THÀNH', sub: 'Trắng có được nhập thành không?' });
    text(ctx, 'LUẬT CHƠI', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 10.0), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Nhập thành: Vua đi 2 ô, Xe nhảy qua Vua', W, H, 0.18, fade(t, 3.6, 10.0), u, { size: 50 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Giữa Vua và Xe đã trống, chưa quân nào đi...', W, H, 0.765, fade(t, 6.0, 10.0), u);
    drawYourTurn(ctx, W, H, u, t, 10.1, REVEAL, 12.4, 'Trắng có được nhập thành ngay bây giờ không?', 'BẠN NGHĨ SAO?', 0.19);
    drawChoices(ctx, W, H, u, t, 10.4, 17.4, ['CÓ', 'KHÔNG'], 1, REVEAL, 0.765);
    drawBang(ctx, W, H, u, t, 'KHÔNG!', REVEAL, 17.4, { size: 140 });
    captionBox(ctx, 'Tượng đen a6 khống chế ô f1: Vua không được đi qua!', W, H, 0.765, fade(t, 17.4, 21.4), u, { color: '#ff8a80' });
    text(ctx, 'KHÔNG ĐƯỢC NHẬP THÀNH KHI', W / 2, H * 0.1, { size: 54, weight: 900, gradient: GOLD_GRAD, stroke: 12, alpha: fade(t, 21.5, 29.9), scale: pop(t, 21.5) }, u);
    captionBox(ctx, '1. Vua hoặc Xe đã từng đi', W, H, 0.5, fade(t, 21.8, 29.9, 0.35, 0.4), u, { size: 48 });
    captionBox(ctx, '2. Vua đang bị chiếu', W, H, 0.59, fade(t, 22.6, 29.9, 0.35, 0.4), u, { size: 48 });
    captionBox(ctx, '3. Vua đi qua hoặc đến ô bị khống chế', W, H, 0.68, fade(t, 23.4, 29.9, 0.35, 0.4), u, { size: 48, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn đoán đúng không? Comment nhé!', W, H, 0.8, fade(t, 24.6, 29.9, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 30.3, D + 1, 0.7, 0.805);
  },
});
