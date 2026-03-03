const SAVED_EVENT_BOOK = 'saved-book';
const RENDER_BOOK_EVENT = 'render-books';
const UPDATE_BOOK_STATUS_EVENT = 'update-book-status';
const DELETE_BOOK_EVENT = 'delete-book';
const EDIT_BOOK_EVENT = 'edit-book';

const STORAGE_KEY = 'BOOKSHELF_APPS';

let finishedBooks = [];
let unfinishedBooks = [];
let isEditMode = false;
let editBookId = null;

function isSupportStorage() {
    if (typeof (Storage) === 'undefined') {
        alert('Your Browser Does Not Support Web Storage!');
        return false;
    }
    return true;
}

function initLoadBookData() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        finishedBooks = data.filter(book => book.isComplete);
        unfinishedBooks = data.filter(book => !book.isComplete);
    }

    document.dispatchEvent(new Event(RENDER_BOOK_EVENT));
}

function generateBookId() {
    return 'BOOK-' + Math.random().toString(36).substr(2, 9);
}

function addBookObject() {
    const bookTitle = document.getElementById('bookFormTitle').value;
    const bookAuthor = document.getElementById('bookFormAuthor').value;
    const bookYear = parseInt(document.getElementById('bookFormYear').value);
    const bookIsCompleted = document.getElementById('bookFormIsComplete').checked;

    const bookObject = {
        id: generateBookId(),
        title: bookTitle,
        author: bookAuthor,
        year: bookYear,
        isComplete: bookIsCompleted
    };

    if (bookIsCompleted) {
        finishedBooks.push(bookObject);
    } else {
        unfinishedBooks.push(bookObject);
    }

    saveBookData();
    document.dispatchEvent(new Event(SAVED_EVENT_BOOK));
}

function saveBookData() {
    if (isSupportStorage()) {
        const allBooks = [...finishedBooks, ...unfinishedBooks];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allBooks));
        document.dispatchEvent(new Event(RENDER_BOOK_EVENT));
    }
}

function updateBookStatus(bookId) {
    let bookIndex = finishedBooks.findIndex(book => book.id === bookId);

    if (bookIndex !== -1) {
        const [book] = finishedBooks.splice(bookIndex, 1);
        book.isComplete = false;
        unfinishedBooks.push(book);
    } else {
        bookIndex = unfinishedBooks.findIndex(book => book.id === bookId);
        if (bookIndex !== -1) {
            const [book] = unfinishedBooks.splice(bookIndex, 1);
            book.isComplete = true;
            finishedBooks.push(book);
        }
    }

    saveBookData();
    document.dispatchEvent(new Event(UPDATE_BOOK_STATUS_EVENT));
}

function initEditBook(bookId) {
    const submitButton = document.getElementById('bookFormSubmit');

    const book = finishedBooks.find(b => b.id === bookId) || unfinishedBooks.find(b => b.id === bookId);

    if (book) {
        document.getElementById('bookFormTitle').value = book.title;
        document.getElementById('bookFormAuthor').value = book.author;
        document.getElementById('bookFormYear').value = book.year;
        document.getElementById('bookFormIsComplete').checked = book.isComplete;

        isEditMode = true;
        editBookId = bookId;
        submitButton.textContent = 'Update Book';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function saveEditedBook() {
    const bookTitle = document.getElementById('bookFormTitle').value;
    const bookAuthor = document.getElementById('bookFormAuthor').value;
    const bookYear = parseInt(document.getElementById('bookFormYear').value);
    const bookIsCompleted = document.getElementById('bookFormIsComplete').checked;

    deleteBook(editBookId, true);

    const updatedBook = {
        id: editBookId,
        title: bookTitle,
        author: bookAuthor,
        year: bookYear,
        isComplete: bookIsCompleted
    };

    if (bookIsCompleted) {
        finishedBooks.push(updatedBook);
    } else {
        unfinishedBooks.push(updatedBook);
    }

    saveBookData();
    document.dispatchEvent(new Event(EDIT_BOOK_EVENT));
}

function deleteBook(bookId, isSilent = false) {
    let bookIndex = finishedBooks.findIndex(book => book.id === bookId);

    if (bookIndex !== -1) {
        finishedBooks.splice(bookIndex, 1);
    } else {
        bookIndex = unfinishedBooks.findIndex(book => book.id === bookId);
        if (bookIndex !== -1) {
            unfinishedBooks.splice(bookIndex, 1);
        }
    }

    saveBookData();
    if (!isSilent) document.dispatchEvent(new Event(DELETE_BOOK_EVENT));
}

function generateBookElement(bookObject) {
    const bookContainer = document.createElement('div');
    bookContainer.classList.add('bookItem');
    bookContainer.setAttribute('data-testid', 'bookItem');
    bookContainer.setAttribute('data-bookid', bookObject.id);

    bookContainer.innerHTML = `
        <h3 data-testid="bookItemTitle">${bookObject.title}</h3>
        <p data-testid="bookItemAuthor">Penulis: ${bookObject.author}</p>
        <p data-testid="bookItemYear">Tahun: ${bookObject.year}</p>
        <div>
            <button data-testid="bookItemIsCompleteButton" class="isCompleteButton" onclick="updateBookStatus('${bookObject.id}')">
                ${bookObject.isComplete ? 'Mark As Unfinished' : 'Mark As Read'}
            </button>
            <button  data-testid="bookItemEditButton" class="editBookButton" onclick="initEditBook('${bookObject.id}')">Edit Book</button>
            <button data-testid="bookItemDeleteButton" class="deleteBookButton" onclick="deleteBook('${bookObject.id}')">Delete Book</button>
        </div>
    `;
    return bookContainer;
}

function searchBooks(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const filteredFinishedBooks = finishedBooks.filter(book => book.title.toLowerCase().includes(lowerKeyword));
    const filteredUnfinishedBooks = unfinishedBooks.filter(book => book.title.toLowerCase().includes(lowerKeyword));

    renderList('completeBookList', filteredFinishedBooks, 'No Finished Book Found.');
    renderList('incompleteBookList', filteredUnfinishedBooks, 'No Unfinished Book Found.');
}

function renderList(containerId, bookList, emptyMessage) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (bookList.length === 0) {
        const p = document.createElement('p');
        p.innerText = emptyMessage;
        container.append(p);
        return;
    }

    for (const book of bookList) {
        container.append(generateBookElement(book));
    }
}

function clearForm() {
    document.getElementById('bookForm').reset();
    const submitButton = document.getElementById('bookFormSubmit');
    submitButton.textContent = 'Add To Shelf';
    isEditMode = false;
    editBookId = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const submitForm = document.getElementById('bookForm');
    submitForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (isEditMode) {
            saveEditedBook();
        } else {
            addBookObject();
        }
    });

    const searchForm = document.getElementById('searchBook');
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const keyword = document.getElementById('searchBookTitle').value;
        searchBooks(keyword);
    });

    initLoadBookData();
});

document.addEventListener(RENDER_BOOK_EVENT, () => {
    renderList('completeBookList', finishedBooks, 'No Finished Book.');
    renderList('incompleteBookList', unfinishedBooks, 'No Unfinished Book.');
});

document.addEventListener(SAVED_EVENT_BOOK, () => {
    alert("Book Data Has Been Saved.");
    clearForm();
});

document.addEventListener(EDIT_BOOK_EVENT, () => {
    alert("Book Data Has Been Updated.");
    clearForm();
});

document.addEventListener(UPDATE_BOOK_STATUS_EVENT, () => {
    clearForm();
});

document.addEventListener(DELETE_BOOK_EVENT, () => {
    alert("Book Has Been Deleted.");
    clearForm();
});