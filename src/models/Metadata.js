const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Metadata = sequelize.define(
  "Metadata",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "metadata",
    timestamps: true,
    underscored: true,
    updatedAt: "updated_at",
    createdAt: false,
  }
);

module.exports = Metadata;
