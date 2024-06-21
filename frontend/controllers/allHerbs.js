import Herbs from '../models/allHerbs.js';
import { Op } from 'sequelize';

export const getAllHerbs = async (req, res) => {
    try {
        const bahans = await Herbs.findAll();
        res.json(bahans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const searchHerbs = async (req, res) => {
    const { kategori, value } = req.query;
    
    try {
        let condition = {};
        
        if (kategori === 'keluhan') {
            condition = {
                keyword: { [Op.like]: `%${value}%` }
            };
        } else if (kategori === 'tanaman') {
            condition = {
                nama: { [Op.like]: `%${value}%` }
            };
        } else {
            return res.status(400).json({ error: 'Invalid category parameter' });
        }

        const herbs = await Herbs.findAll({
            where: condition
        });

        res.json(herbs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
