process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let test_isbn;

//create sample book to test
beforeEach(async () => {
	let book = await db.query(`
    INSERT INTO 
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES(
            '123456789', 
            'https://amazon.com/buttz', 
            'Dr. Buttz', 
            'ButtSpeak', 
            420, 
            'Butts&Co', 
            'Lord of the Butts: Fellowship of the Butts', 
            2020)
        RETURNING isbn`);

	test_isbn = book.rows[0].isbn;
});

describe('GET /books', function() {
	test('Gets all books from db', async function() {
		const res = await request(app).get('/books').expect('Content-Type', /json/);
		const books = res.body.books;
		expect(books.length).toBe(1);
		expect(res.statusCode).toBe(200);
		expect(books[0]).toHaveProperty('isbn');
	});
});

describe('GET /books/:id', function() {
	test('Gets book by id from db', async function() {
		const res = await request(app).get(`/books/${test_isbn}`).expect('Content-Type', /json/);
		const book = res.body.book;
		expect(res.statusCode).toBe(200);
		expect(book).toHaveProperty('isbn');
		expect(book.isbn).toBe(`${test_isbn}`);
		expect('');
	});
	test('Returns error 404 if book not found in db', async function() {
		const res = await request(app).get(`/books/135792468`);
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /books', function() {
	test('Creates a new book in db', async function() {
		const res = await request(app)
			.post('/books')
			.send({
				isbn: '666666666',
				amazon_url: 'www.amazon.com/moarbuttz',
				author: 'Dr. Buttz',
				language: 'ButtSpeak',
				pages: 123,
				published: 'Butts&Co',
				title: 'The Lord of the Butts: The Two Butts',
				year: 2021
			})
			.expect('Content-Type', /json/);
		const book = res.body.book;
		expect(res.statusCode).toBe(201);
		expect(book).toHaveProperty('title');
		expect(book.title).toBe('The Lord of the Butts: The Two Butts');
	});
	test('Expect error message if invalid book data sent', async function() {
		const res = await request(app).post('/books').send({
			amazon_url: 'www.amazon.com/moarbuttz',
			author: 'Dr. Buttz',
			language: 'ButtSpeak',
			pages: 123,
			title: 'The Lord of the Butts: The Two Butts',
			year: 2021
		});
		expect(res.statusCode).toBe(400);
	});
});

describe('PUT /books/:id', function() {
	test('Updates a books info', async function() {
		const res = await request(app)
			.put(`/books/${test_isbn}`)
			.send({
				amazon_url: 'www.amazon.com/morebutte',
				author: 'Dr. Butte',
				language: 'ButteSpeak',
				pages: 123,
				published: 'Buttes&Co',
				title: 'A River Runs Through Butte',
				year: 2021
			})
			.expect('Content-Type', /json/);
		const book = res.body.book;
		expect(res.statusCode).toBe(200);
		expect(book.title).toBe('A River Runs Through Butte');
	});
	test('Will not update book with incorrect data', async function() {
		const res = await request(app).put(`/books/${test_isbn}`).send({
			amazon_url: 'www.amazon.com/morebutte',
			author: 'Dr. Butte',
			pages: 123,
			published: 'Buttes&Co',
			year: 2021
		});
		expect(res.statusCode).toBe(400);
	});
	test('Returns 404 if book id not found', async function() {
		const res = await request(app).put('/books/98765432').send({
			amazon_url: 'www.amazon.com/morebutte',
			author: 'Dr. Butte',
			language: 'ButteSpeak',
			pages: 123,
			published: 'Buttes&Co',
			title: 'A River Runs Through Butte',
			year: 2021
		});
		expect(res.statusCode).toBe(404);
	});
});

describe('DELETE /books/:id', function() {
	test('Deletes book from db given ISBN', async function() {
		const res = await request(app).delete(`/books/${test_isbn}`);
		expect(res.body.message).toBe('Book deleted');
	});
	test('Returns 404 if book not found', async function() {
		const res = await request(app).delete('/books/13526438');
		expect(res.statusCode).toBe(404);
	});
});

//clear out test db
afterEach(async function() {
	await db.query('DELETE FROM BOOKS');
});

//end tests
afterAll(async function() {
	await db.end();
});
