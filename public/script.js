 document.addEventListener("DOMContentLoaded", function () {
     //counter increment
     const counters = document.querySelectorAll(".counter");
     const observer = new IntersectionObserver((entries, observer) => {
         entries.forEach(entry => {
             if (entry.isIntersecting) {
                 let counter = entry.target;
                 let target = +counter.getAttribute("data-target");
             let count = 0;
             let speed = 5;

             let updateCount = setInterval(() => {
                 count += Math.ceil(speed);
                 counter.textContent = count.toLocaleString() + "+";

                 if (count >= target) {
                     counter.textContent = target.toLocaleString() + "+";
                     clearInterval(updateCount);
                 }
             }, 55);

             observer.unobserve(counter); // Stop observing after animation
         }
     });
     }, { threshold: 1 }); // Runs when 50% of the element is visible
     counters.forEach(counter => observer.observe(counter));

     //testimonials
     const testimonialtrack = document.getElementById('testimonialTrack');
     const testimonialindicators = document.querySelectorAll('#testimonialIndicator button');

     function updateTestimonial(index) {
         testimonialtrack.style.transform = `translateX(-${index * 100}%)`;
         testimonialindicators.forEach(btn => btn.classList.remove('active'));
         testimonialindicators[index].classList.add('active');
     }

     testimonialindicators.forEach(btn => {
         btn.addEventListener('click', () => {
             const index = parseInt(btn.getAttribute('data-index'));
             updateTestimonial(index);
        });
     });

     //pagination
     const cardsPerPage = 12;
     const bookCards = document.querySelectorAll('.book-card');
     const paginationContainer = document.getElementById('pagination');
     let currentPage = 1;

     window.showPage= function (page) {
         currentPage = page;
         const start = (page - 1) * cardsPerPage;
         const end = start + cardsPerPage;

         bookCards.forEach((card, index) => {
             card.style.display = (index >= start && index < end) ? '' : 'none';
         });

         renderPagination();
     }

     function renderPagination() {
         const totalPages = Math.ceil(bookCards.length / cardsPerPage);
         paginationContainer.innerHTML = '';

         for (let i = 1; i <= totalPages; i++) {
           const btn = document.createElement('button');
           btn.textContent = i;
           btn.className = 'btn btn-sm mx-1 ' + (i === currentPage ? 'btn-dark' : 'btn-outline-dark');
           btn.addEventListener('click', () => showPage(i));
               paginationContainer.appendChild(btn);
         }
     }

      if (bookCards.length > 0) {
         showPage(1);
     } 

     //confirmation modal for update book
     const updateform = document.getElementById('updateBook');
     if (updateform) {
         updateform.addEventListener('submit', function (e) {
             e.preventDefault(); 
             showModal(
                 'Do you really want to update?', 
                 () => {
                     updateform.submit(); // submit manually if confirmed
                 },     
                 'btn-primary'
             );
         });
     }

      //confirmation modal for add book
     const addform = document.getElementById('addBook');
     if (addform) {
         addform.addEventListener('submit', function (e) {
             e.preventDefault(); 
             showModal(
                 'Do you really want to add?', 
                 () => {
                     addform.submit(); // submit manually if confirmed
                 },     
                 'btn-primary'
             );
         });
     }

     //confirmation modal in signup form
     const signupform = document.getElementById('signupForm');
     if (signupform) {
         signupform.addEventListener('submit', function (e) {
             e.preventDefault(); 
             showModal(
                 'Do you really want to signup?', 
                 () => {
                     signupform.submit(); // submit manually if confirmed
                 },     
                 'btn-primary'
             );
         });
     }

 });

 //Show password toggle button
 function showPassword(iconElement) {
     const passwordInput = document.getElementById('passwordInput');
     const isPassword = passwordInput.type === 'password';

     passwordInput.type = isPassword ? 'text' : 'password';

     iconElement.classList.toggle('bi-eye');
     iconElement.classList.toggle('bi-eye-slash');
 }

 //update page
 function displayImageFileUploader(){
     document.getElementById('imageUploader').style.display= 'block'
 }

 function displayDownloadFileUploader(){
     document.getElementById('downloadUploader').style.display= 'block'
 }

 //confirmation modal
 function showModal(message, confirmCallback, btnClass = 'btn-primary') {
     document.getElementById('modal-message').textContent = message;

     const modal = document.getElementById('confirmationModal');
     const confirmBtn = document.getElementById('confirmBtn');

     confirmBtn.className = 'btn'; 
     confirmBtn.classList.add(btnClass); 

  
     confirmBtn.onclick = () => {
         closeModal();
         confirmCallback();
     };

     modal.style.display = 'flex';

    console.log("hello")
}
 function closeModal() {
     document.getElementById('confirmationModal').style.display = 'none';
 }

 //search bar by book title
 function searchBooks() {
     const query = document.getElementById('searchInput').value.toLowerCase();
     const bookCards = document.querySelectorAll('.book-card');
     const pagination= document.getElementById('pagination')

     bookCards.forEach(card => {
         const title = card.querySelector('.books-title').textContent.toLowerCase();
         card.style.display = title.includes(query) ? '' : 'none';
     });

     if(query===''){
         pagination.style.display='block'
         showPage(1);
     }
     else{
         pagination.style.display='none'
     }
 }