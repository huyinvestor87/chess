// Đố Cờ #7 – Bắt tốt qua đường: 1. e4 Nf6 2. e5 d5 3. exd6 e.p.
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang, drawChoices } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 34;
const REVEAL = 16.4;
export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'en-passant', name: 'Đố Cờ #7 – Bắt tốt qua đường', duration: D, coverTime: 1.6 },
  moves: [
    { san: 'e4', t: 6.2 },
    { san: 'Nf6', t: 7.0 },
    { san: 'e5', t: 7.9 },
    { san: 'd5', t: 9.1, dur: 0.6 },
    { san: 'exd6', t: 17.4, dur: 0.65 },
  ],
  marks: [
    { t0: 9.8, t1: 16.8, squares: [['e5', 'G', 0.4], ['d5', 'R', 0.4]] },
    { t0: 16.6, t1: 18.4, arrows: [['e5', 'd6', 'G']], squares: [['d5', 'R', 0.5]], blink: true },
    { t0: 18.2, t1: 21.4, squares: [['d6', 'G', 0.45]] },
  ],
  cam: standardCam(29.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 7, title: 'LUẬT LẠ CỦA TỐT', titleSize: 116, sub: 'Tốt trắng ăn được Tốt đen không?' });
    text(ctx, 'XEM KỸ NHÉ', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 11.2), scale: pop(t, 3.3) }, u);
    captionBox(ctx, 'Để ý Tốt trắng ở cột e', W, H, 0.18, fade(t, 3.6, 11.2), u, { size: 52 });
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Trắng đẩy Tốt e4, Đen ra Mã f6', W, H, 0.765, fade(t, 6.0, 7.9), u);
    captionBox(ctx, 'Tốt trắng tiến tiếp lên e5', W, H, 0.765, fade(t, 7.9, 9.1), u);
    captionBox(ctx, 'Đen đẩy Tốt d5: đi 2 ô, đứng ngay cạnh Tốt trắng!', W, H, 0.765, fade(t, 9.1, 11.2), u, { color: '#ffd56a' });
    drawYourTurn(ctx, W, H, u, t, 11.3, REVEAL, 12.9, 'Tốt trắng e5 có ăn được Tốt đen d5 không?', 'BẠN NGHĨ SAO?', 0.19);
    drawChoices(ctx, W, H, u, t, 11.6, 17.9, ['CÓ', 'KHÔNG'], 0, REVEAL, 0.765);
    drawBang(ctx, W, H, u, t, 'CÓ!', REVEAL, 18.2, { colors: ['#eaffef', '#33d17a', '#16a34a'], glow: 'rgba(51,209,122,0.6)', size: 150 });
    captionBox(ctx, 'Tốt trắng ăn chéo sang d6, Tốt đen d5 bị bắt!', W, H, 0.765, fade(t, 18.0, 21.4), u, { color: '#ffd56a' });
    text(ctx, 'BẮT TỐT QUA ĐƯỜNG', W / 2, H * 0.1, { size: 72, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: fade(t, 18.3, 29.9), scale: pop(t, 18.3) }, u);
    text(ctx, '(en passant)', W / 2, H * 0.155, { size: 46, weight: 700, alpha: fade(t, 18.6, 29.9), stroke: 8 }, u);
    captionBox(ctx, 'Chỉ được bắt NGAY nước tiếp theo, để lỡ là mất quyền!', W, H, 0.69, fade(t, 21.5, 29.9, 0.35, 0.4), u, { size: 50, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn đã biết luật này chưa? Comment nhé!', W, H, 0.8, fade(t, 22.7, 29.9, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 30.3, D + 1, 0.7, 0.805);
  },
});
