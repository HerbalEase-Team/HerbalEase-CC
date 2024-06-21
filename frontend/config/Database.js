import { Sequelize } from "sequelize";
const db = new Sequelize('herbalease', 'roott','',{
    host: "34.46.48.66",
    dialect: "mysql"
});

export default db;