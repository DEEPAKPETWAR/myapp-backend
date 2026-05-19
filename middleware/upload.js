// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({

//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },

//   filename: function (req, file, cb) {

//     const uniqueName =
//       Date.now() + path.extname(file.originalname);

//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;
// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },

//   filename: (req, file, cb) => {
//     cb(
//       null,
//       Date.now() + path.extname(file.originalname)
//     );
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed =
//     /jpg|jpeg|png/;

//   const ext =
//     allowed.test(
//       path.extname(
//         file.originalname
//       ).toLowerCase()
//     );

//   if (ext) {
//     cb(null, true);
//   } else {
//     cb(
//       new Error(
//         "Only image files allowed"
//       )
//     );
//   }
// };

// module.exports = multer({
//   storage,
//   fileFilter,
// });
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({
  storage,
});

module.exports = upload;