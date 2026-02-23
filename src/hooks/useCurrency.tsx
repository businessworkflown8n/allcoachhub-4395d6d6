import { useEffect, useState } from "react";

type CurrencyInfo = {
  currency: "INR" | "USD";
  symbol: string;
  priceKey: "price_inr" | "price_usd";
  originalPriceKey: "original_price_inr" | "original_price_usd";
};

const INR: CurrencyInfo = { currency: "INR", symbol: "₹", priceKey: "price_inr", originalPriceKey: "original_price_inr" };
const USD: CurrencyInfo = { currency: "USD", symbol: "$", priceKey: "price_usd", originalPriceKey: "original_price_usd" };

export const useCurrency = (): CurrencyInfo => {
  const [info, setInfo] = useState<CurrencyInfo>(USD);

  useEffect(() => {
    const cached = sessionStorage.getItem("user_currency");
    if (cached === "INR") {
      setInfo(INR);
      return;
    }
    if (cached === "USD") return;

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data?.country_code === "IN") {
          setInfo(INR);
          sessionStorage.setItem("user_currency", "INR");
        } else {
          sessionStorage.setItem("user_currency", "USD");
        }
      })
      .catch(() => {
        sessionStorage.setItem("user_currency", "USD");
      });
  }, []);

  return info;
};
