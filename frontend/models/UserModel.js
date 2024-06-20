import { Sequelize } from 'sequelize';
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const Users = db.define('users',{
    name:{
        type: DataTypes.STRING
    },
    email:{
        type: DataTypes.STRING
    },
    password:{
        type: DataTypes.STRING
    },
    refresh_token:{
        type: DataTypes.TEXT
    },
    profile_picture_url: {
        type: DataTypes.STRING 
    }
},{
    freezeTableName:true
});

const ForumDiscussion = db.define('diskusi', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING, 
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
          model: Users,
          key: 'id',
        },
    },
    title: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT
    },
    keyword: {
        type: DataTypes.STRING
    },
    photoDiscussionUrl: {
        type: DataTypes.STRING
    }
},{
    freezeTableName:true,
    timestamps: false
});

const Comment = db.define('komen', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING
    },
    comment: {
        type: DataTypes.TEXT
    },
    forumDiscussionId: {
        type: DataTypes.INTEGER,
        references: {
            model: ForumDiscussion,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: Users,
            key: 'id'
        }
    }
},{
    freezeTableName:true,
    timestamps: false
});


Users.hasMany(ForumDiscussion, { foreignKey: 'userId', as: 'ForumDiscussions' });
Users.hasMany(Comment, { foreignKey: 'userId', as: 'Comments' });

ForumDiscussion.belongsTo(Users, { foreignKey: 'userId', as: 'Users' });
ForumDiscussion.hasMany(Comment, { foreignKey: 'forumDiscussionId', as: 'Comments' });

Comment.belongsTo(ForumDiscussion, { foreignKey: 'forumDiscussionId', as: 'ForumDiscussion' });
Comment.belongsTo(Users, { foreignKey: 'userId', as: 'Users' });


export { Users, ForumDiscussion, Comment };