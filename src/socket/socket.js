const { socketConstants } = require("../constants/socketConstants");
const { getPollingResult } = require("../util/pollingResult.util");

exports.initiateServer = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });
  let users = {
    student: {},
    teacher: {},
  };

  // Cleanup function to clear all users after every 5 minutes
  setInterval(() => {
    users = {
      student: {},
      teacher: {},
    };
  }, 5 * 60 * 1000); // 5 minutes

  io.on("connection", (socket) => {
    socket.on(socketConstants.createStudent, (data) => {
      if (users.student[data.studentId]) {
        io.to(socket.id).emit(socketConstants.alreadyExists, {
          id: socket.id,
          studentId: data.studentId,
        });
      } else {
        users.student[data.studentId] = {
          studentId: data.studentId,
          name: data.name,
          questions: [],
          socketId: socket.id,
        };
        io.to(socket.id).emit(socketConstants.connectionId, {
          studentId: data.studentId,
        });
        Object.keys(users.teacher).forEach((item) => {
          io.to(users.teacher[item]?.socketId).emit(
            socketConstants.onlineStudents,
            {
              list: Object.keys(users.student).map((item) => {
                const studentDetails = users.student[item];
                return {
                  name: studentDetails.name,
                  socketId: studentDetails.socketId,
                  studentId: studentDetails.studentId,
                };
              }),
            }
          );
        });
      }
    });

    socket.on(socketConstants.createTeacher, (data) => {
      users.teacher[data.teacherId] = {
        socketId: socket.id,
        questions: [],
        pollResult: [],
        teacherId: data.teacherId,
      };
      io.to(socket.id).emit(socketConstants.connectionId, {
        id: socket.id,
        teacherId: data.teacherId,
      });
    });

    socket.on(socketConstants.oldConnection, (data) => {
      if (users?.student[data.id] || users?.teacher[data.id]) {
        io.to(socket.id).emit(socketConstants.validConnection, {
          status: true,
        });
      } else {
        io.to(socket.id).emit(socketConstants.validConnection, {
          status: false,
        });
      }
    });

    socket.on(socketConstants.questionPost, (data) => {
      users.teacher[data.id] = {
        ...users.teacher[data.id],
        questions: [...users.teacher[data.id]?.questions, data],
      };
      Object.keys(users.student).forEach((key) => {
        io.to(users.student[key].socketId).emit(
          socketConstants.questionPublish,
          data
        );
      });
    });

    socket.on(socketConstants.answerPublish, (data) => {
      users.student[data?.id]?.questions?.push(data);
      io.to(data.id).emit(socketConstants.answerSubmitted, { status: true });
    });

    socket.on(socketConstants.getResult, (data) => {
      const result = getPollingResult(users, data.id);
      users.teacher[data.id] = {
        ...users.teacher[data.id],
        pollResult: [
          ...users.teacher[data.id]?.pollResult,
          { question: data.question, options: result },
        ],
      };

      Object.keys(users.student).forEach((key) => {
        io.to(users.student[key].socketId).emit(socketConstants.resultPublish, {
          status: true,
          question: data.question,
          options: result,
        });
      });
      io.to(users.teacher[data.id]?.socketId).emit(
        socketConstants.resultPublish,
        {
          status: true,
          question: data.question,
          options: result,
        }
      );
    });

    socket.on(socketConstants.getOnlineStudents, () => {
      io.to(socket.id).emit(socketConstants.onlineStudents, {
        list: Object.keys(users.student).map((item) => {
          const studentDetails = users.student[item];
          return {
            name: studentDetails.name,
            socketId: studentDetails.socketId,
            studentId: studentDetails.studentId,
          };
        }),
      });
    });

    socket.on(socketConstants.closeConnection, (data) => {
      delete users.student[data.studentId];
      io.to(data.socketId).emit(socketConstants.triggerClose);
      io.to(socket.id).emit(socketConstants.onlineStudents, {
        list: Object.keys(users.student).map((item) => {
          const studentDetails = users.student[item];
          return {
            name: studentDetails.name,
            socketId: studentDetails.socketId,
            studentId: studentDetails.studentId,
          };
        }),
      });
    });

    socket.on(socketConstants.getPollingHistory, (data) => {
      io.to(socket.id).emit(socketConstants.pollingHistory, {
        status: true,
        result: users.teacher[data.teacherId]?.pollResult || [],
      });
    });

    socket.on(socketConstants.settingNewQuestion, () => {
      Object.keys(users.student).forEach((key) => {
        io.to(users.student[key].socketId).emit(
          socketConstants.newQuestionInbound
        );
      });
    });
  });
};
