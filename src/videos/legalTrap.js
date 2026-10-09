// Đố Cờ #8 – Bẫy Légal: 1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#
import { fade, pop, GOLD_GRAD, text, captionBox, drawFollow, drawCover, drawYourTurn, drawBang, drawChoices } from './common.js';
import { makeGameVideo, standardCam } from './gameVideo.js';

const D = 38;
const REVEAL = 16.8;
export const { meta, createVideo } = makeGameVideo({
  meta: { id: 'legal-trap', name: 'Đố Cờ #8 – Bỏ Hậu để thắng', duration: D, coverTime: 1.6 },
  moves: [
    { san: 'e4', t: 3.6, dur: 0.45 },
    { san: 'e5', t: 4.3, dur: 0.45 },
    { san: 'Nf3', t: 5.0, dur: 0.5 },
    { san: 'd6', t: 5.7, dur: 0.45 },
    { san: 'Bc4', t: 6.4, dur: 0.5 },
    { san: 'Bg4', t: 7.2, dur: 0.5 },
    { san: 'Nc3', t: 8.4, dur: 0.5 },
    { san: 'g6', t: 9.1, dur: 0.45 },
    { san: 'Nxe5', t: 10.0, dur: 0.65 },
    { san: 'Bxd1', t: 17.4, dur: 0.6 },
    { san: 'Bxf7+', t: 18.7, dur: 0.6 },
    { san: 'Ke7', t: 19.9, dur: 0.5 },
    { san: 'Nd5#', t: 21.0, dur: 0.7 },
  ],
  marks: [
    { t0: 7.8, t1: 10.0, arrows: [['g4', 'd1', 'R']] },
    { t0: 10.8, t1: 16.9, arrows: [['g4', 'd1', 'R']], squares: [['d1', 'R', 0.45]], blink: true },
    { t0: 21.9, t1: 26.0, squares: [['d5', 'G', 0.45], ['e5', 'G', 0.45], ['f7', 'G', 0.45]] },
  ],
  cam: standardCam(33.9, D),
  overlay(ctx, W, H, u, t) {
    drawCover(ctx, W, H, u, t, { num: 8, title: 'BỎ HẬU ĐỂ THẮNG', titleSize: 116, sub: 'Bẫy cờ hơn 270 năm tuổi' });
    text(ctx, 'XEM KỸ NHÉ', W / 2, H * 0.1, { size: 58, gradient: GOLD_GRAD, alpha: fade(t, 3.3, 11.6), scale: pop(t, 3.3) }, u);
    drawFollow(ctx, W, H, u, t, 3.4, 6.0, 0.765, 0.665);
    captionBox(ctx, 'Đen ghim Mã f3: Mã đi là mất Hậu', W, H, 0.765, fade(t, 6.4, 9.9), u);
    captionBox(ctx, 'Trắng vẫn cho Mã ăn Tốt e5 – bỏ Hậu?!', W, H, 0.765, fade(t, 9.9, 11.6), u, { color: '#ff8a80' });
    drawYourTurn(ctx, W, H, u, t, 11.8, REVEAL, 13.6, 'Đen có nên ăn Hậu trắng không?', 'BẠN NGHĨ SAO?', 0.19);
    drawChoices(ctx, W, H, u, t, 12.1, 17.6, ['NÊN ĂN', 'KHÔNG'], 1, REVEAL, 0.765);
    drawBang(ctx, W, H, u, t, 'KHÔNG!', REVEAL, 18.4, { size: 140 });
    captionBox(ctx, 'Nếu Đen ăn Hậu...', W, H, 0.765, fade(t, 17.5, 18.7), u);
    captionBox(ctx, 'Tượng chiếu! Vua phải chạy lên e7', W, H, 0.765, fade(t, 18.7, 21.0), u, { color: '#ff8a80' });
    drawBang(ctx, W, H, u, t, 'CHIẾU HẾT!', 21.8, 26.0);
    captionBox(ctx, 'Mã d5 chiếu hết, dù Trắng đã mất Hậu!', W, H, 0.765, fade(t, 22.1, 26.0), u, { color: '#ffd56a' });
    text(ctx, 'BẪY LÉGAL (1750)', W / 2, H * 0.1, { size: 72, weight: 900, gradient: GOLD_GRAD, stroke: 14, alpha: fade(t, 26.1, 33.9), scale: pop(t, 26.1) }, u);
    captionBox(ctx, 'Thí Hậu để chiếu hết bằng 3 quân nhẹ – bẫy hơn 270 năm tuổi!', W, H, 0.69, fade(t, 26.3, 33.9, 0.35, 0.4), u, { size: 48, color: '#ffd56a', accent: 'rgba(242,193,78,0.8)' });
    captionBox(ctx, 'Bạn có ăn Hậu không? Comment nhé!', W, H, 0.8, fade(t, 27.5, 33.9, 0.35, 0.4), u, { size: 46 });
    drawFollow(ctx, W, H, u, t, 34.3, D + 1, 0.7, 0.805);
  },
});
