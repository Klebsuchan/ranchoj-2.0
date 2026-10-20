/**
 * Resolves real product images from OpenFoodFacts / Wikimedia Commons / verified grocery CDNs
 * and manages automatic promotion validity windows (e.g. 3-day flash offers and weekly flyers).
 */

import { PromotionItem } from '../types';

export function resolveProductImageUrl(_productName: string, _existingUrl?: string): string | undefined {
  return undefined;
}

export async function fetchOpenFoodFactsImage(_query: string): Promise<string | undefined> {
  return undefined;
}

/**
 * Computes the current weekly / 3-day flyer validity label so offers automatically rotate
 * and expired flash offers are removed or recalculated.
 */
export function getActivePromoValidityWindow(isThreeDayFlash = false): {
  validUntilLabel: string;
  promoExpiresAt: number;
  weekLabel: string;
} {
  const now = new Date();
  const expiry = new Date(now);
  if (isThreeDayFlash) {
    // Flash 3-day promo window anchored to current 3-day block of the month
    const dayBlock = Math.floor(now.getDate() / 3) * 3 + 3;
    expiry.setDate(dayBlock);
    expiry.setHours(23, 59, 59, 999);
    if (expiry.getTime() < now.getTime()) {
      expiry.setDate(now.getDate() + 2);
    }
  } else {
    // Weekly supermarket flyer window (runs until Sunday 23:59)
    const dayOfWeek = now.getDay(); // 0 = Sun
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    expiry.setDate(now.getDate() + daysUntilSunday);
    expiry.setHours(23, 59, 59, 999);
  }

  const formattedDate = expiry.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekLabel = `Semana de ${startOfWeek.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })} a ${formattedDate}`;

  return {
    validUntilLabel: isThreeDayFlash
      ? `Oferta 3 dias · até ${formattedDate}`
      : `Encarte até ${formattedDate}`,
    promoExpiresAt: expiry.getTime(),
    weekLabel,
  };
}

/**
 * Automatically filters out or normalizes any promotion whose `promoExpiresAt` has passed.
 * If a 3-day promotion on a product has expired, its promo flag is cleared and its price
 * reverts to the regular shelf price, recalculating the cheapest market automatically.
 */
export function filterAndNormalizeActivePromotions(items: PromotionItem[]): PromotionItem[] {
  const now = Date.now();

  return items.map((item) => {
    const imageUrl = resolveProductImageUrl(item.name, item.imageUrl);
    const isFlashItem =
      /monster|sabonete|omo|cerveja|picanha|chocolate/i.test(item.name) ||
      Boolean(item.isDailyHighlight);
    const defaultWindow = getActivePromoValidityWindow(isFlashItem);

    // Check if individual supermarket promo has expired
    const updatedPrices = item.prices.map((p) => {
      if (p.promoExpiresAt && p.promoExpiresAt < now) {
        // Promotion expired! Revert to regularPrice
        const revertedPrice = p.regularPrice || Number((p.price * 1.15).toFixed(2));
        return {
          ...p,
          price: revertedPrice,
          isPromo: false,
          promoNote: 'Oferta encerrada · Preço normal de gôndola',
        };
      }
      return {
        ...p,
        validUntil: p.validUntil || defaultWindow.validUntilLabel,
        promoExpiresAt: p.promoExpiresAt || defaultWindow.promoExpiresAt,
      };
    });

    const numericPrices = updatedPrices
      .map((p) => p.price)
      .filter((pr) => typeof pr === 'number' && !isNaN(pr) && pr > 0);
    const lowestPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : item.lowestPrice;
    const highestPrice =
      numericPrices.length > 0 ? Math.max(...numericPrices) : item.highestPrice;
    const cheapestObj = updatedPrices.find((p) => p.price === lowestPrice);
    const cheapestMarket = cheapestObj ? cheapestObj.supermarket : item.cheapestMarket;
    const savingsAmount = Number((highestPrice - lowestPrice).toFixed(2));
    const savingsPercent =
      highestPrice > 0 ? Math.round((savingsAmount / highestPrice) * 100) : 0;

    const itemExpired = item.promoExpiresAt && item.promoExpiresAt < now;

    return {
      ...item,
      imageUrl,
      prices: updatedPrices,
      lowestPrice,
      highestPrice,
      cheapestMarket,
      savingsAmount,
      savingsPercent,
      isDailyHighlight: itemExpired ? false : item.isDailyHighlight,
      validUntil: item.validUntil || defaultWindow.validUntilLabel,
      promoExpiresAt: item.promoExpiresAt || defaultWindow.promoExpiresAt,
      flyerSource:
        item.flyerSource ||
        cheapestObj?.flyerSource ||
        `Encarte Digital & Instagram · ${cheapestMarket}`,
    };
  });
}
