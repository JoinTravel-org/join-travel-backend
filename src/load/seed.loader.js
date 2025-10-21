import { AppDataSource } from "./typeorm.loader.js";
import placeRepository from "../repository/place.repository.js";
import logger from "../config/logger.js";

const seedPlaces = [
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "Lugar",
    address: "Lugar",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "",
    rating: null
  },
  {
    name: "El Ateneo Grand Splendid",
    address: "Av. Sta. Fe 1860, C1123 Cdad. Autónoma de Buenos Aires, Argentina",
    latitude: -34.59598330,
    longitude: -58.39422850,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2fmdkUxFpoSYc-fz41EgiaqANEedf6su6bqg-18AxTZKCIm2yA6WmsnS612O0WaXBCz1wgaxDst1PyGOnmOcyND7xbz6EtmVD3tZtGUVUqfZ2Z0QVJ9rZedDBn0b_1gmats-itP-5iyCkJeCr-DlyCdAfwmhy3-8X9OVXFXKVs4IH9RMgPn8d6LzFTVQMNPcsXSH27G-tXKl2pYv1CZkcZ31IHJO1HfA2ilXJVld1O5qRZdnnIRBv0RcXWyzQwsIwnNo3yNVSjH_lBcdKTgnZwNl6HRDgCoMiZOB3BI6fieKw&3u600&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=102422",
    rating: null
  },
  {
    name: "Barrio Chino",
    address: "Barrio Chino, C1428 Buenos Aires, Argentina",
    latitude: -34.55713440,
    longitude: -58.45088150,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2czYgeZxyBzXtIHOfzD01ZHfLEk8wGMmRwuE5qzHzcRhZd3ceaWIQssqV7FjfJmeylYBkgMTT4mQpG01ziqLWDdZw0RnHY9x7zkv4jcI2KCY1lZt4brlAxF4QPYfaa7TOMYRohE2KQxjK937A3AXlAWnv_Wn4lDZV16lHBbzm-yJFg47IZyGKS1T7OAqGDB46EiFUrcr-i2AW6yTqi1ah7BQU_BsHbKTOmrMfs1tIlcUEgtkHjb55aoBdMxtv4GzuB4hsvobYxmzezOceJlCyBFC4KwJFBn9xBfoOcjqlFjfFSFOyNcp6vwR15RZdhCEPJJ9AWTdZWZCwZZjfeYXu4gnAAqIDmkE4mimnIKtynYn3vNnNqSF5lfZd07UetDznCzU4dbC3zMuI_b3o5Vwp3ChX3hzYs9YoMbx_sTkEb-Ug&3u1200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=77729",
    rating: null
  },
  {
    name: "Estadio Alberto J Armando",
    address: "Brandsen 805, C1161AAQ Cdad. Autónoma de Buenos Aires, Argentina",
    latitude: -34.63561090,
    longitude: -58.36475630,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f5jPu9WTBlMhQjW6jwc_iaBbacAXojlGNdkTGHJxldAtis_EcU8j0E4rt3g5WgUVBrOL1It0XjjAp52z-XXPH6Sv90ssybdjMLuDBjc0z1rSqbGV3PNHW_mbEGUFhW8th097fIon6fctSy71CQbIfAkTccHeT8nTzM7ONW7Cf6mgUYOSyeQaM48wPvyzR3AtVWpWekVboGzTioMheYfe9vKb21Vw0VJkJ-vCvVUkGlBOdarLLqDYblX2xXN_pMsmtSgZN3RD_uQqd3CazcZIVQBX7rNmb3v0bS9Jpq-gHqUlYg6bbe_P9vcQWkdA0SUjUgHJtmZFNaBA1tBpcAQ3lxV6ad5r4Uwap41WXVUCo5CCGclke6V74FaPTLR11xyM0mkIARHU2wUHETPx58LlSxSPtA-zI-BCaEJFfh4e-TR8I&3u720&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=69645",
    rating: null
  },
  {
    name: "Recoleta Cemetery",
    address: "Junín 1760, C1113 Cdad. Autónoma de Buenos Aires, Argentina",
    latitude: -34.58736390,
    longitude: -58.39295550,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2eJy2vR5lDQG2_9wO8jYmM2pC38ejJwgdBFyhN7HhxlmOxtg7nMlR3ln0Cd5QWqk3TqfrNAP1HtdvV33YIN4AOyfw9_3Ls7H0qPs3TG235c4Z743Sqe0vRp4mUdDEkTlaGu0t4DU8XnmycbxyuFdEgQZYIBfUYHboqY4t-eU5ul-tmR-OgEqgyOQ1tEN1CRIixNzZKmEUBCjDd5QZKJ3xvhVdAfE0JvmL3s7a6AWVU4y64GG8TIbn_rzSwBfAKNR6wylQ1goo1xXTAPfyvV6b58X_VHql36zWayM6pzUj_az6FIX27ny3PUPe5WivVAqRvWnnTyNbDFI1fadd-CY6fW7qrPIQ3WULEN8eGBAGXob9Iusk9jTB6IzHBdbf8c22OcljsZ7Oq45aWvevadS-2BOOQ7MNteNoQyDvnjZwOuzk3SZog2V8TrR2bdd8bY&3u1200&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=350",
    rating: null
  },
  {
    name: "El Rosedal Garden",
    address: "Palermo, C1425 Buenos Aires, Argentina",
    latitude: -34.57065060,
    longitude: -58.41729960,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2cjwQ6-CU2R5Ou0Bz41Dna1wU-Rl4EORBff2HfKpDZSGSRfQtd4CAz2n7KKKyo1EBX86zelxfmhGO3uSbW20E-c-pZi740v14GEGAJuau5oBuvMoR_4cT5Db6Rb06ZPixYv6zJJ-8apZKCBWQfPjNpcx_mZMl2c_oXIUqgyujEcU0t86hCONDpMi3ovXVuRKgmALvwcyyw0_wp5OKVHVsDsnrSSzHAv02w7G87hjaaPUO45yTJSUJmkBGDY3Kj6L_dwFxDSJnloUsu55QjvefKqZmea-6CaoWYpa7-ERUsT85pxm21vKRciZ0L9O1uKjyRJwh-bGoxRLdG8LBDHfsfvi3XugerRDw7ZrcqtXnx4_q4BM-9y8fL3qDC5v8JdBEv9Czt_wk49ARQ45bw52HrBW9cM_NP4et_QY0X6HBIqAz83&3u4032&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=83478",
    rating: null
  },
  {
    name: "Casa Rosada",
    address: "Balcarce 78, C1064AAC Cdad. Autónoma de Buenos Aires, Argentina",
    latitude: -34.60805560,
    longitude: -58.37027780,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2dWbHvyqRFfjfldN0bDdw8NJ_KRHgNjZgn91CSTu0ECNM5VK6cdyZCTewGTD1OvylevrxIHdiUmMgLjQVmBvGdbM-xGLfd8HYSVqm--M7iQRexLQ6r9obunyfH7sh1-I4UOtwR9AYCW7n30rW48jd96elosMCyce4WDtNxSvgbxrZUmJBB6KC5vEuEdbJ3dF98AySkwbXwoHChqFOpOVYcvupwRVzNScWVLFI0bn1UUIzjtl2oCWZ709KEz0l6gX470YU3twVN-yjdfTRTX46TIc2A8bBi3StdZklnX0tA8wyLzhtiBsuz17g4kvr0nE27ljIY4Hfjvr7ZVOe2kOm2J-POZuA3eBKOkIRoCwKI2Cut8Vn_yJuHCqD7Qa1-ykgYXtku4Wn5T_Oi0ECfdIe9-iecdG02KbQgNoadHtHVW3qoE&3u3699&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=41154",
    rating: null
  },
  {
    name: "Jardín Japonés",
    address: "Av. Casares 3450, C1425EWN C1425EWN, Cdad. Autónoma de Buenos Aires, Argentina",
    latitude: -34.57483410,
    longitude: -58.40842190,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f8pLraWsfh5Zed5um-YWD-s11y7nlQnfNEJ3tpx6tInM4xQnl4GVxH6rcMXbD1o_bJIDhHHgk4U5NijrBBPSsPukApY-5cxweo68NoGOuhkgjQMdnfUlJJZqlmcxE3SXLhTnmwFOZ0MECsZNRaAYfv2lPKLxu1CqzxjgODHfdxqvgYN2-qH1k1NdEuiwRRLy4mSu7vgzJLUqR2SRVG9j_D9cDEGfhM4_0ApPnTiVZlMSl7nvV-XqmxDQfarU0r6bzoPoq031mx8QXWafISGbOhjeVZdhxGpLwGmkKhYuPRLQ&3u4608&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=54483",
    rating: null
  },
  {
    name: "Teatro Colón",
    address: "Cerrito 628, C1010 Cdad. Autónoma de Buenos Aires, Argentina",
    latitude: -34.60115200,
    longitude: -58.38332780,
    image: "https://maps.googleapis.com/maps/api/place/js/PhotoService.GetPhoto?1sAciIO2f5hBk6gVe8NKGod1FGXvNAw9XsvX8JD3DouUvOeK5AX-1VxJLSWpmHeL7Wxjhs-xHywIA4wy_KxmmPR8LjKfTKlb_pXd-CxceLBB7bqqWwSdLwnFFPD6CWhd13UbKTNGjTH8379ydoUL2cW5E9iXZUVcbhScbHrhmPH8TXaMDXLcY2Ehx2PJXvuMcGV3l1_IPRMSx7Gncc0Ka8XBqkg8fSyOe_0G2tiYkcxFTX1PHOIOl00pP3-Z8IiKPAQgHlywhpxMQCm7DHGvB_d45graQ7gQS2wA6ZFWLfXHUBnljyZDh1kVxOZ2ak1cA7red0QTHavNzl3Y_9ue0zgDZ0EzKxrHB-gjW6x7Krn5WnmpgNIcOFQBhGro8v5BuFlnHEo1Ds4IVTpElbTjBCR1p7qGv4wUo1x4pGhbhKDL9blm3OVds-&3u2000&5m1&2e1&callback=none&r_url=http%3A%2F%2Flocalhost%3A3003%2Fadd-place&key=AIzaSyAYAirOIe_jSpPQlE3irymvRNC2YBnqfoo&token=83836",
    rating: null
  },
];

export default async function seedDatabase() {
  try {
    // Check if places already exist
    const existingPlaces = await placeRepository.getRepository().count();
    if (existingPlaces > 0) {
      logger.info(`Database already has ${existingPlaces} places, skipping seed`);
      return;
    }

    logger.info("Seeding database with places...");

    for (const placeData of seedPlaces) {
      try {
        await placeRepository.create(placeData);
        logger.info(`Seeded place: ${placeData.name}`);
      } catch (error) {
        logger.error(`Failed to seed place ${placeData.name}:`, error.message);
      }
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Database seeding failed:", error);
    throw error;
  }
}