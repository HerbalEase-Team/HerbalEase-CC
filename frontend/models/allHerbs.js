import { Sequelize } from 'sequelize';
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const allHerbs = db.define('allaboutherb', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    kandungan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    khasiat: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    keyword: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rekomendasi_menu: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false
});

export default allHerbs;
