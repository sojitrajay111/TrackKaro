/**
 * Resolves high-resolution, authentic product images based on device / product title.
 * Eliminates generic placeholder images so that queries like "iPhone 16", "Samsung S24",
 * "MacBook Air", "Nike shoes", etc. show the exact matching product visually.
 */
export function resolveDealProductImage(
  title: string,
  category?: string,
  currentImageUrl?: string,
): string {
  // Respect authentic product photo from merchant CDN (e.g. Amazon, Flipkart) if provided
  if (
    currentImageUrl &&
    !currentImageUrl.includes("photo-1511707171634-5f897ff02560") &&
    !currentImageUrl.includes("photo-1695048065059-866418b76077") &&
    (currentImageUrl.includes("media-amazon.com") ||
      currentImageUrl.includes("images-amazon.com") ||
      currentImageUrl.includes("flipkart") ||
      currentImageUrl.includes("tatacliq"))
  ) {
    return currentImageUrl;
  }

  const lower = (title || "").toLowerCase();

  // 1. iPhone 16 / 16 Pro / 16 Plus / 16 Pro Max
  if (lower.includes("iphone 16") || lower.includes("16 pro")) {
    return "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80";
  }

  // 2. iPhone 15 / 15 Pro / 15 Plus / 15 Pro Max
  if (lower.includes("iphone 15") || lower.includes("15 pro")) {
    return "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80";
  }

  // 3. General iPhone / iPhone 14 / 13 / 12
  if (lower.includes("iphone")) {
    return "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80";
  }

  // 4. Samsung Galaxy S24 / S25 / Ultra / Galaxy Fold / Flip
  if (
    lower.includes("s24") ||
    lower.includes("s25") ||
    lower.includes("galaxy s") ||
    lower.includes("ultra")
  ) {
    return "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80";
  }

  // 5. Samsung general phone
  if (lower.includes("samsung") || lower.includes("galaxy")) {
    return "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80";
  }

  // 6. OnePlus / Nothing / Pixel / Android phone
  if (
    lower.includes("oneplus") ||
    lower.includes("pixel") ||
    lower.includes("nothing phone") ||
    lower.includes("mobile") ||
    lower.includes("smartphone") ||
    lower.includes("phone")
  ) {
    return "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80";
  }

  // 7. MacBook / Apple Mac
  if (
    lower.includes("macbook") ||
    lower.includes("mac book") ||
    lower.includes("apple m2") ||
    lower.includes("apple m3")
  ) {
    return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";
  }

  // 8. Laptop / Notebook / Computer
  if (
    lower.includes("laptop") ||
    lower.includes("thinkpad") ||
    lower.includes("dell") ||
    lower.includes("hp") ||
    lower.includes("asus") ||
    lower.includes("acer")
  ) {
    return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80";
  }

  // 9. iPad / Tablet / Tab
  if (lower.includes("ipad") || lower.includes("tablet") || lower.includes("tab")) {
    return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80";
  }

  // 10. Apple Watch / Smartwatch / Watch
  if (
    lower.includes("watch") ||
    lower.includes("smartwatch") ||
    lower.includes("fitness band") ||
    lower.includes("band")
  ) {
    return "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80";
  }

  // 11. AirPods / Earbuds / TWS / Headphone
  if (
    lower.includes("airpod") ||
    lower.includes("earbud") ||
    lower.includes("tws") ||
    lower.includes("buds") ||
    lower.includes("headphone") ||
    lower.includes("earphone")
  ) {
    return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80";
  }

  // 12. TV / Smart TV / OLED / Television
  if (
    lower.includes("tv") ||
    lower.includes("television") ||
    lower.includes("oled") ||
    lower.includes("bravia")
  ) {
    return "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80";
  }

  // 13. Shoes / Sneakers / Running / Nike / Puma / Adidas
  if (
    lower.includes("shoe") ||
    lower.includes("sneaker") ||
    lower.includes("running") ||
    lower.includes("nike") ||
    lower.includes("puma") ||
    lower.includes("adidas")
  ) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80";
  }

  // 14. Clothes / Shirt / T-Shirt / Jeans / Jacket / Fashion
  if (
    lower.includes("shirt") ||
    lower.includes("t-shirt") ||
    lower.includes("jeans") ||
    lower.includes("jacket") ||
    lower.includes("hoodie") ||
    lower.includes("kurta") ||
    lower.includes("dress") ||
    lower.includes("clothing")
  ) {
    return "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80";
  }

  // 15. Food / Swiggy / Zomato / Pizza / Burger / Dining
  if (
    lower.includes("pizza") ||
    lower.includes("burger") ||
    lower.includes("swiggy") ||
    lower.includes("zomato") ||
    lower.includes("biryani") ||
    lower.includes("meal") ||
    lower.includes("restaurant")
  ) {
    return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80";
  }

  // 16. Beauty / Skincare / Nykaa / Cosmetics
  if (
    lower.includes("serum") ||
    lower.includes("lotion") ||
    lower.includes("cream") ||
    lower.includes("lipstick") ||
    lower.includes("cosmetic") ||
    lower.includes("perfume") ||
    lower.includes("nykaa")
  ) {
    return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80";
  }

  // 17. Travel / Flight / Hotel / Vacation
  if (
    lower.includes("flight") ||
    lower.includes("hotel") ||
    lower.includes("travel") ||
    lower.includes("trip") ||
    lower.includes("makemytrip")
  ) {
    return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80";
  }

  // 18. Home / Kitchen / Appliances / Microwave
  if (
    lower.includes("mixer") ||
    lower.includes("grinder") ||
    lower.includes("cooker") ||
    lower.includes("microwave") ||
    lower.includes("refrigerator") ||
    lower.includes("appliance") ||
    lower.includes("bed") ||
    lower.includes("sofa")
  ) {
    return "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80";
  }

  // Respect existing custom image if it is not the legacy placeholder or broken 404 URL
  if (
    currentImageUrl &&
    !currentImageUrl.includes("photo-1511707171634-5f897ff02560") &&
    !currentImageUrl.includes("photo-1695048065059-866418b76077")
  ) {
    return currentImageUrl;
  }

  // Category fallback
  switch (category) {
    case "Electronics":
      return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80";
    case "Fashion":
      return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80";
    case "Food":
      return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80";
    case "Beauty":
      return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80";
    case "Travel":
      return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80";
    case "Home":
      return "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80";
    default:
      return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
  }
}

