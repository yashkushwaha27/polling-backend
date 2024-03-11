exports.getPollingResult = (users, teacherId) => {
  const { teacher, student } = users;
  const teacherQuestionsArray = teacher[teacherId]?.questions;
  const questionId =
    teacherQuestionsArray[teacherQuestionsArray?.length - 1]?.questionId;
  const options =
    teacherQuestionsArray[teacherQuestionsArray?.length - 1]?.options;

  const studentAnswers = [];
  Object.keys(student).map((key) => {
    const res = student[key].questions.filter(
      (data) => data.question.questionId === questionId
    );
    studentAnswers.push(res[0]?.answer);
  });
  let result = [];

  options.forEach((option) => {
    const count = studentAnswers.reduce(
      (acc, ans) => (option === ans ? acc + 1 : acc),
      0
    );
    result.push({ value: option, count });
  });

  const totalResponses = result.reduce((acc, value) => acc + value.count, 0);

  result = result.map((item) => {
    const computedPercentage = parseFloat(
      (item.count * 100) / totalResponses
    ).toFixed(2);
    return {
      ...item,
      percentage: isNaN(computedPercentage) ? 0 : computedPercentage,
    };
  });

  return result;
};
