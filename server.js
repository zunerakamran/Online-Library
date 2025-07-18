 //creating database
 const db= require('better-sqlite3')('OnlineLibrary.db')
 db.pragma('journal_mode= WAL')

 //For hasing passwprd
 const bcrypt= require('bcrypt')
 const salt= bcrypt.genSaltSync(10);

 //token for cookies
 const jwt= require('jsonwebtoken')
 //Secret key value to create token by jwt
 const secretKey= "myTopSecretKeyToStoreCookiesTokenInTheBrowserSoNoOneCanReallyKnowWhatIsInsideOfTheToken"
 const cookieParser = require('cookie-parser'); //to parse the cookies 

 //to upload files from the user
 const multer= require('multer')
 const path = require('path')
 const fs= require('fs')

 const express = require("express"); //get and post request
const { console } = require('inspector');
 const app = express();

 const createTables = db.transaction(() => {

     db.prepare(`
         CREATE TABLE IF NOT EXISTS users(
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             username TEXT NOT NULL UNIQUE,
             fullname TEXT NOT NULL,
             email TEXT NOT NULL UNIQUE,
             password TEXT NOT NULL
         )
     `).run();

     db.prepare(`
         CREATE TABLE IF NOT EXISTS books (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             category TEXT NOT NULL,
             image TEXT NOT NULL,
             title TEXT NOT NULL,
             author TEXT NOT NULL,
             publisher TEXT NOT NULL,
             narrator TEXT NOT NULL,
             releasedYear TEXT NOT NULL,
             releasedDate TEXT NOT NULL,
             download TEXT NOT NULL,
             details TEXT NOT NULL,
             userid INT,
             isVerified BOOLEAN DEFAULT FALSE,

             FOREIGN KEY (userid) REFERENCES users(id)
         )
     `).run();
 });
 createTables(); //calling the function 

 //middlewares
 app.set('view engine', 'ejs'); //load the ejs files
 app.use(express.static('public')); //load the public folder 
 app.use(express.urlencoded({extented:false})); //middleware to use the data passes in request 
 app.use(cookieParser()) //parse the cookies

 //middleware to put the token in user global variable
 app.use((req,res,next)=>{
     res.locals.user= req.cookies.tokenCookie
     if(res.locals.user){
         const info= jwt.verify(res.locals.user,secretKey)
         res.locals.userid= info.userid
         res.locals.username=info.username
     }
     next()
 })
  
 //function to check if the user is logged in or not
 function isLoggedIn(req,res,next){
     if(res.locals.user){
         next()
     }
     else{
         res.redirect('/')
     }
 }

 //function to check if the user is admin
 function isAdmin(req,res,next){
     if(res.locals.username ==='admin'){
         next()
     }
     else{
         res.redirect('/')
     }
 }

 //validate book form
 function validateBookForm(title, author, narrator, publisher, releasedDate, releasedYear, details) {
     let errors = [];

     // Trim inputs
     title = title?.trim();
     author = author?.trim();
     narrator = narrator?.trim();
     publisher = publisher?.trim();
     details = details?.trim();

     // Book Title
     const titleRegex = /^[A-Za-z0-9\s\-:,.!?()]{2,100}$/;
     if (!title || title.length < 2 || title.length > 100 || !titleRegex.test(title)) {
         errors.push(
            'Invalid book title. Only letters, numbers, and basic punctuation allowed (2–100 characters).'
         );
     }

     // Book Author, Narrator, Publisher
     const nameRegex = /^[A-Za-z\s.'-]{2,50}$/;
     if (!author || !nameRegex.test(author)) {
         errors.push(
            'Invalid author name. Only letters, spaces, apostrophes, and hyphens allowed (2–50 characters).'
         );
    }
     if (!narrator || !nameRegex.test(narrator)) {
         errors.push(
            'Invalid narrator name. Only letters, spaces, apostrophes, and hyphens allowed (2–50 characters).'
         );
     }
     if (!publisher || !nameRegex.test(publisher)) {
         errors.push(
            'Invalid publisher name. Only letters, spaces, apostrophes, and hyphens allowed (2–50 characters).'
         );
     }

     // Released Year
     releasedYear = parseInt(releasedYear);
     if (isNaN(releasedYear) || releasedYear < 1000 || releasedYear > new Date().getFullYear()){
         errors.push(
             'Invalid released year. Must be between 1000 and the current year.'
         );
     }

     // Released Date
     releasedDate = new Date(releasedDate);
     const today = new Date();
     if (isNaN(releasedDate.getTime()) || releasedDate > today) {
         errors.push('Invalid released date. It cannot be in the future.');
     }

     // Year-Date match
     if (!isNaN(releasedDate.getTime()) && releasedYear !== releasedDate.getFullYear()) {
         errors.push('Released Year and Released Date must match.');
     }

     // Details
     const detailsPattern = /^[\s\S]{20,5000}$/;
     if (!details || details.length < 20  || !detailsPattern.test(details)) {
         errors.push('Details must be at least 20 characters and can include any text.');
     }

     return errors;
 }

 //multer functionality
 const storage = multer.diskStorage({
    destination: (req, file, cb) => {
         if (file.fieldname === 'image') cb(null, 'public/images/books/');
         else if (file.fieldname === 'download') cb(null, 'public/books/');
     },
     filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
 });

 const upload = multer({ storage: storage }).fields([
     { name: 'image', maxCount: 1 },
     { name: 'download', maxCount: 1 }
 ]);

 app.get("/", (req, res) => {
     const selectBook= db.prepare(`
         SELECT *
         FROM books
         WHERE isVerified=?
         ORDER BY id DESC
         LIMIT  12
     `)
     const books= selectBook.all(1)
     res.render('home',{books})
 });

 app.get("/categories/:type", (req,res)=>{
     let books=[];
     let category= req.params.type
     if(category=="all"){
         const selectData = db.prepare(`
             SELECT id, image,title,author,releasedYear
             FROM books
             WHERE isVerified = ?
             ORDER BY id DESC
         `)
         books= selectData.all(1);
     }
     if(category == "children"){
         const selectData = db.prepare(`
             SELECT id, image,title,author,releasedYear,category
             FROM books
             WHERE category = ? AND isVerified = ?
             ORDER BY id DESC
         `)
         books=selectData.all('Children',1);
     }
     if(category == "fiction"){
         const selectData = db.prepare(`
             SELECT id, image,title,author,releasedYear,category
             FROM books
             WHERE category = ? AND isVerified = ?
             ORDER BY id DESC
         `)
         books=selectData.all('Fiction',1);
     }
     if(category == "history"){
         const selectData = db.prepare(`
             SELECT id, image,title,author,releasedYear,category
             FROM books
             WHERE category = ? AND isVerified = ?
             ORDER BY id DESC
         `)
         books=selectData.all('History',1);
     }
     if(category == "biography"){
         const selectData = db.prepare(`
             SELECT id, image,title,author,releasedYear,category
             FROM books
             WHERE category = ? AND isVerified = ?
             ORDER BY id DESC
         `)
         books=selectData.all('Biography',1);
     }
     if(category == "arts"){
         const selectData = db.prepare(`
             SELECT id, image,title,author,releasedYear,category
             FROM books
             WHERE category = ? AND isVerified = ?
             ORDER BY id DESC
         `)
         books=selectData.all('Arts',1);
     }
     res.render('categories', {books,category})
 })

 app.get("/books/:id",(req,res)=>{
     let book={}
     let suggestions=[]
     let id= req.params.id
     book= db.prepare(`
         SELECT *
         FROM books
         WHERE id = ?
     `).get(id)

     let users=db.prepare(`
         SELECT username
         FROM users
         WHERE id=?
     `).get(book.userid)

     suggestions=db.prepare(`
         SELECT id,image, title,author,releasedYear
         FROM books
         WHERE category =? AND id != ? AND isVerified = ?
         ORDER BY id DESC
         LIMIT 4 
     `).all(book.category, id, 1)
     res.render('books',{book,suggestions,users})
 })

 app.get('/signup',(req,res)=>{
    res.render('signup',{errors: []})
 })

 app.post('/signup',(req,res)=>{
     const {
         username,
         fullname,
         email,
         password
     }= req.body

     let errors=[];

     // server side validation 

     //only alphabets and spaces of size 2 to 40
     const fullNameRegex = /^[A-Za-z\s]{2,40}$/; 
     if(!fullname || !fullNameRegex.test(fullname)){
         errors.push('Full name must be 2-40 characters and contain only letters and spaces.')
     }
 
     //onlu contains alphabet and numbers with size of 8 to 20
     const usernameRegex = /^[a-zA-Z0-9_]{8,20}$/; 
     if(!username || !usernameRegex.test(username)){
         errors.push('Invalid username. It must be 8-20 characters long and can only contain letters, numbers, and underscores.')
     }

     //contains special character with aplhabets and number @ is mandatory
     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
     if(!email || !emailRegex.test(email)){
         errors.push('Invalid email format.')
     }

     //contains special character,aplabets(upper and lower), numbers and it is atleast of 8 characters
     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
     if(!password || !passwordRegex.test(password)){
         errors.push('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.')
     }
     
     const selectData= db.prepare(`
         SELECT  *
         FROM users
         WHERE username = ? OR email = ?
     `)
     const alreadyExists= selectData.get(username, email)
     if(alreadyExists){
         errors.push('Username or Email already exists')
     }
     if(!username || !password || !email || !fullname){
         errors.push('Fill the whole form')
     }

     if(errors.length){
         res.render('signup', {errors})
     }
     else{
         //hashing the password for security purpose
         const hashPassword= bcrypt.hashSync(password, salt)
         const insertData= db.prepare(`
             INSERT INTO users(fullname, username, email, password)
             VALUES(?, ?, ?, ?)
         `)
         insertData.run(fullname, username, email, hashPassword)
         res.render('login', {username, password,error:null})
     }
 })

 app.get('/login',(req,res)=>{
     res.render('login', {username:null, password: null, error:null})
 })

 app.post('/login', (req, res) => {
     let error = "";
     const username = req.body.username;
     const password = req.body.password;

     const selectData = db.prepare(`
         SELECT id, username, password
         FROM users
         WHERE username = ?
     `)
     const user= selectData.get(username);

     if (!user) {
         error = "Username is invalid";
         return res.render('login', { username: null, password: null, error });
     }

     bcrypt.compare(password, user.password, (err, match) => {
         if (err) {
             console.error(err);
             return res.status(500).send("Internal server error");
         }

         if (match) {
             const token = jwt.sign(
                 {userid: user.id, username: username },secretKey,{ expiresIn:'1d' }
             );

             res.cookie("tokenCookie", token, {
                 httpOnly: true,
                 secure: false,
                 sameSite: "strict",
                 maxAge: 1000 * 60 * 60 * 24,
             });

             res.redirect('/');
         } 
         else {
             error = "Password is invalid";
             res.render('login', { username: null, password: null, error });
         }
     });
 });

 app.get('/logout',(req,res)=>{
     res.clearCookie('tokenCookie')
     res.redirect('/');
 })

 app.get('/add-book', isLoggedIn,(req,res)=>{
    res.render('add-book',{errors:[]})
 })

app.post('/add-book', isLoggedIn, (req, res) => {
     upload(req, res, function (err) {
         if (err) {
             console.error('Upload error:', err);
             return res.status(500).send('File upload failed');
         }

         //take the first file incase multiple files are upload
         const imageFile = req.files['image'] ? req.files['image'][0] : null;
         const downloadFile = req.files['download'] ? req.files['download'][0] : null;

         const userid = res.locals.userid;
         const username = res.locals.username;
         let verified = username === 'admin' ? 1 : 0;

         const {
             title,
             author,
             narrator,
             publisher,
             category,
             releasedYear,
             releasedDate,
             details
         } = req.body;

         let errors = validateBookForm(title, author, narrator, publisher, releasedDate, releasedYear, details);

         // Check for missing files
         if (!imageFile || !downloadFile) {
             errors.push('Both image and PDF are required.');
         }

         // If errors exist, delete any uploaded files
         if (errors.length) {
             if (imageFile && fs.existsSync(imageFile.path)) {
                 fs.unlinkSync(imageFile.path);
             }
            if (downloadFile && fs.existsSync(downloadFile.path)) {
                 fs.unlinkSync(downloadFile.path);
             }

             return res.render('add-book', { errors });
         }

         let imagePath = imageFile.path.replace('public', '');
         let downloadPath = downloadFile.path.replace('public', '');

         const insertData = db.prepare(`
             INSERT INTO books(title, author, category, userid, image, publisher, narrator, releasedDate, releasedYear, download, details, isVerified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `);

         insertData.run(title, author, category, userid, imagePath, publisher, narrator, releasedDate, releasedYear, downloadPath, details, verified);
         if(userid=== 100){
             res.redirect('/my-books');
         }
         else{
             res.redirect('/pending-books');
         }
     });
 });

 app.get('/my-books', isLoggedIn, (req,res)=>{
     const userid= res.locals.userid
     const selectData= db.prepare(`
         Select *
         FROM books
         WHERE userid=? AND isVerified = ?
         ORDER BY id DESC
     `)
     const mybooks=selectData.all(userid, 1)
     res.render('my-books',{mybooks})
 })

 app.get('/my-books/delete/:id',isLoggedIn,(req,res)=>{
     const bookid= req.params.id
     const selectData=db.prepare(`
         SELECT image, download, userid, isVerified
         FROM books
         WHERE id=?
     `)
     const filePath= selectData.get(bookid)

     //contions to delete for both admin and users
     if(res.locals.userid === filePath.userid || res.locals.userid === 100){
         if(res.locals.userid === filePath.userid && filePath.isVerified && 
             res.locals.userid !== 100){
             res.redirect('/');
         }
         else{
             const imagePath = path.join(__dirname, 'public', filePath.image);
             const downloadPath = path.join(__dirname, 'public', filePath.download);
             fs.unlink(imagePath,(err)=>{
                 if(err){
                     console.log("Error is: ", err)
                 }
                 else{
                     console.log("Image Deleted")
                 }
             })
             const cleanDownload= filePath.download.replace(/\\/g, '/')
             if(cleanDownload !== '/books/book1.pdf'){
                 fs.unlink(downloadPath,(err)=>{
                     if(err){
                         console.log("Error is: ", err)
                     }
                     else{
                         console.log("Download Deleted")
                     }
                 })
             }
             const deleteData=db.prepare(`
                 DELETE FROM BOOKS
                 WHERE id=?
             `)
             deleteData.run(bookid)
             res.redirect('/categories/all')
         }
     }
     else{
         res.redirect('/')
     }
 })

 app.get('/my-books/verify/:id',isLoggedIn, isAdmin,(req,res)=>{
     const bookid= req.params.id
     const updateBook= db.prepare(` 
         UPDATE books
         SET isVerified=?
         WHERE id=?
     `)
     updateBook.run(1, bookid)
     res.redirect('/verified-books')
 })

 app.get('/my-books/update/:id', isLoggedIn, isAdmin, (req,res)=>{
     const bookid=req.params.id
     const selectBook= db.prepare(`
        SELECT *
        FROM books
        WHERE id=?
     `)
     const book =selectBook.get(bookid)
     res.render('update',{book,bookid,errors:[]})
 })

 app.post('/my-books/update/:id',isLoggedIn, isAdmin, (req, res) => {
     const bookid = req.params.id;
     
     upload(req, res, (err) => {
         if (err) {
             console.log('Multer error:', err);
             return res.status(500).send("Upload error");
         }
    
         const selectData = db.prepare(`
             SELECT *
             FROM books 
             WHERE id = ?
         `)
         const book= selectData.get(bookid);
    
         const {
             title,
             category,
             author,
             publisher,
             narrator,
             releasedYear,
             releasedDate,
             details,
         } = req.body;

         const imageFile = req.files['image'] ? req.files['image'][0] : null;
         const downloadFile = req.files['download'] ? req.files['download'][0] : null;

         let errors= validateBookForm(title,author,narrator,publisher,releasedDate,releasedYear,details);
         if(errors.length){
             if (imageFile && fs.existsSync(imageFile.path)) {
                 fs.unlinkSync(imageFile.path);
             }
             if (downloadFile && fs.existsSync(downloadFile.path)) {
                 fs.unlinkSync(downloadFile.path);
             }
             return res.render('update',{book,bookid,errors})
         }
    
         let newImage= book.image
         let newDownload= book.download
         const selectFiles= db.prepare(`
             Select image,download
             From books
             Where id = ?
         `)
         const oldFiles= selectFiles.get(bookid);
         // ✅ Update image file if changed
         if (imageFile) {
             const imagePath = path.join(__dirname, 'public', oldFiles.image);
             fs.unlink(imagePath, (err) => {
                 if (err) console.log("Image delete error:", err);
                 else console.log("Old image deleted");
             });
             newImage= imageFile.path
             newImage = newImage.replace('public', '');
         }

         // ✅ Update download file if changed
         if (downloadFile) {
             const cleanDownload= oldFiles.download.replace(/\\/g, '/')
             const downloadPath = path.join(__dirname, 'public', oldFiles.download);
             if (cleanDownload !== '/books/book1.pdf') {
                 fs.unlink(downloadPath, (err) => {
                     if (err) console.log("Download delete error:", err);
                     else console.log("Old download deleted");
                 });
             }
             newDownload= downloadFile.path
             newDownload = newDownload.replace('public', '');
         }

         // ✅ Update the database
         const updateData=db.prepare(`
             UPDATE books
             SET title = ?, category = ?, author = ?, publisher = ?, narrator = ?, releasedYear = ?, releasedDate = ?, details = ?, image = ?, download = ?
             WHERE id = ?
         `)
         updateData.run(
             title, category, author, publisher, narrator, releasedYear, releasedDate, details, newImage, newDownload, bookid
         );
         res.redirect('/my-books');
     });

 });
 
 app.get('/pending-books',isLoggedIn,(req,res)=>{
     const username= res.locals.username
     const userid= res.locals.userid
     let pending_books
     if(username==='admin'){
         const pending= db.prepare(`
             SELECT *
             FROM books
             WHERE isVerified = ?
             ORDER BY id DESC
         `)
         pending_books= pending.all(0)
     }
     else{
         const pending= db.prepare(`
             SELECT *
             FROM books
             WHERE userid = ? AND isVerified = ?
             ORDER BY id DESC
         `)
         pending_books= pending.all(userid,0)
     }
     res.render('pending-books',{pending_books})
 })

 app.get('/verified-books',isLoggedIn,isAdmin,(req,res)=>{
     const verifiedBooks= db.prepare(`
         SELECT *
         FROM books
         WHERE isVerified=? AND userid != ?
         ORDER BY id DESC
     `)
     const books= verifiedBooks.all(1,100)
     res.render('verified-books',{books})
 })

 //404 page if the other than above routes are called
 app.use((req, res) => {
     res.status(404).render('404'); 
 });

 const PORT = 3000;
 app.listen(PORT, () => {
     console.log(`Server running at http://localhost:${PORT}`);
 });
