
function getDoseQuantity(dose) {
  const match = String(dose || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)(?=\s|$)/);

  if (!match) {
    return null;
  }

  const quantity = Number(match[1]);

  return Number.isFinite(quantity) && quantity > 0
    ? quantity
    : null;
}

function calculateStockStatus(medicine) {
  const stock = Number(medicine.stock ?? 0);
  const quantity = getDoseQuantity(medicine.dose);
  const timesPerDay = medicine.times?.length || 0;
  const lowStockDays = Number(medicine.lowStockDays ?? 5);

  if (
    !Number.isFinite(stock) ||
    !quantity ||
    timesPerDay === 0
  ) {
    return {
      stock,
      dailyUsage: null,
      daysRemaining: null,
      status: "unknown",
      message: "Unable to calculate stock usage",
    };
  }

  const dailyUsage = quantity * timesPerDay;
  const daysRemaining = stock / dailyUsage;

  let status = "sufficient";
  let message = "Stock is sufficient";

  if (stock <= 0) {
    status = "out_of_stock";
    message = "Medicine is out of stock";
  } else if (daysRemaining <= lowStockDays) {
    status = "low_stock";
    message = "Medicine stock is running low";
  }

  return {
    stock,
    dailyUsage,
    daysRemaining: Math.round(daysRemaining * 10) / 10,
    status,
    message,
  };
}

module.exports = {
  getDoseQuantity,
  calculateStockStatus,
};
