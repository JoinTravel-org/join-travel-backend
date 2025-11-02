export default {
  preset: null,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!uuid|@langchain|@googlemaps|google-auth-library|googleapis|reflect-metadata|typeorm|typeorm-extension|better-sqlite3|sqlite3|pg|mongodb|mssql|oracledb|mysql2|redis|react|react-dom|@types|@babel|jest|supertest|multer|nodemailer|bcrypt|winston|morgan|helmet|express-rate-limit|cors|dotenv|validator|swagger-jsdoc|swagger-ui-express|uuid|winston|reflect-metadata|typeorm|typeorm-extension|better-sqlite3|sqlite3|pg|mongodb|mssql|oracledb|mysql2|redis|react|react-dom|@types|@babel|jest|supertest|multer|nodemailer|bcrypt|winston|morgan|helmet|express-rate-limit|cors|dotenv|validator|swagger-jsdoc|swagger-ui-express)/',
  ],
};