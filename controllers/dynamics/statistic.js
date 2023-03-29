const { requestError } = require('../../helpers');
const { Transaction } = require('../../models/transactions');
const { Personal } = require('../../models/personal');

async function statisticInfo(req, res) {
  const { _id } = req.user;

  const date = req.body;
  console.log(date);

  // incomes for the selected month

  const incomeSumPerSelectedMonth = await Transaction.aggregate([
    {
      $match: {
        $and: [
          { owner: _id },
          { categoryType: 'income' },
          {
            $expr: {
              $eq: [{ $month: '$createdAt' }, date?.month],
            },
          },
          {
            $expr: {
              $eq: [{ $year: '$createdAt' }, date?.year],
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $toDouble: '$sum' } },
      },
    },
    {
      $project: {
        _id: 0,
        income: '$total',
      },
    },
  ]);

  // expenses for the selected month
  const expenseSumPerSelectedMonth = await Transaction.aggregate([
    {
      $match: {
        $and: [
          { owner: _id },
          { categoryType: 'expense' },
          {
            $expr: {
              $eq: [{ $month: '$createdAt' }, date?.month],
            },
          },
          {
            $expr: {
              $eq: [{ $year: '$createdAt' }, date?.year],
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $toDouble: '$sum' } },
      },
    },
    {
      $project: {
        _id: 0,
        expense: '$total',
      },
    },
  ]);

  // acumulated for the selected month
  const acumulatedSumPerSelectedMonth =
    incomeSumPerSelectedMonth[0]?.income -
    expenseSumPerSelectedMonth[0]?.expense;

  // plan money per month

  const { passiveIncome, salary, procent } = await Personal.findOne({
    owner: _id,
  });
  if (!passiveIncome || !salary || !procent) {
    throw requestError(404);
  }
  const planMoneyPerMonth = ((salary + passiveIncome) * procent) / 100;

  // plan percentage per month

  const percentagePlanPerMonth =
    (acumulatedSumPerSelectedMonth / planMoneyPerMonth) * 100;

  res.json({
    incomeSumPerSelectedMonth: incomeSumPerSelectedMonth[0]?.income,
    expenseSumPerSelectedMonth: expenseSumPerSelectedMonth[0]?.expense,
    acumulatedSumPerSelectedMonth,
    planMoneyPerMonth,
    percentagePlanPerMonth: Math.round(percentagePlanPerMonth),
  });
}

module.exports = statisticInfo;
