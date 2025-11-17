"use client";
import { useEffect, useState } from "react";

interface Document {
id: number;
title: string;
content: string;
created_at: string;
}

export default function DocumentsPage() {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [editId, setEditId] = useState<number | null>(null);

	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Document[]>([]);
	const [searchMode, setSearchMode] = useState(false);

	const loadDocuments = async () => {
		const res = await fetch("http://localhost:3001/documents");
		const data = await res.json();
		setDocuments(data);
	};

	useEffect(() => {
		loadDocuments();
	}, []);

	const handleSearch = async () => {
		if (!query.trim()) {
			setSearchMode(false);
			return loadDocuments();
		}

		const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
		const data = await res.json();

		setSearchResults(data);
		setSearchMode(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editId) {
			await fetch(`http://localhost:3001/documents/${editId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title, content }),
			});
			setEditId(null);
		} else {
			await fetch("http://localhost:3001/documents", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title, content }),
			});
		}
		setTitle("");
		setContent("");
		loadDocuments();
	};

	const handleEdit = (doc: Document) => {
		setEditId(doc.id);
		setTitle(doc.title);
		setContent(doc.content);
	};

	const handleDelete = async (id: number) => {
		await fetch(`http://localhost:3001/documents/${id}`, {
			method: "DELETE",
		});
		loadDocuments();
	};

	const list = searchMode ? searchResults : documents;

	return (
		<main className="min-h-screen p-8">
			<div className="max-w-3xl mx-auto">

				<h1 className="text-4xl font-extrabold mb-8 text-center">
					📜 Notary Dashboard
				</h1>

				<div className="mb-6 flex gap-3">
					<input
						type="text"
						placeholder="Search documents..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="flex-1 p-2 bg-[#111] text-white border border-gray-600 rounded"
					/>
					<button
						type="button"
						onClick={handleSearch}
						className="bg-blue-700 text-white px-4 py-2 rounded"
					>
						Search
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="bg-[#111] shadow-md rounded-lg p-6 mb-10 border border-gray-700"
				>
					<h2 className="text-2xl font-semibold mb-4">
						{editId ? "✏️ Modify a Document" : "➕ Add a Document"}
					</h2>

					<input
						type="text"
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full p-2 bg-[#111] text-white border border-gray-700 rounded mb-4"
						required
					/>

					<textarea
						placeholder="Content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="w-full p-2 bg-[#111] text-white border border-gray-700 rounded mb-4 h-28"
						required
					/>

					<div className="flex gap-3">
						<button
							type="submit"
							className="bg-blue-600 text-white px-5 py-2 rounded-lg"
						>
							{editId ? "Update" : "Add"}
						</button>

						{editId && (
							<button
								type="button"
								onClick={() => {
									setEditId(null);
									setTitle("");
									setContent("");
								}}
								className="bg-gray-600 text-white px-5 py-2 rounded-lg"
							>
								Cancel
							</button>
						)}
					</div>
				</form>

				{list.length === 0 ? (
					<p className="text-center text-gray-400">No documents found.</p>
				) : (
					<ul className="space-y-4">
						{list.map((doc) => (
							<li
								key={doc.id}
								className="bg-[#111] border border-gray-700 p-5 rounded-lg"
							>
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-xl font-semibold text-white">
											{doc.title}
										</h3>
										<p className="text-gray-300 whitespace-pre-wrap mt-1">
											{doc.content}
										</p>
										<p className="text-sm text-gray-500 mt-2">
											Created at {new Date(doc.created_at).toLocaleString()}
										</p>
									</div>

									<div className="flex gap-3 text-lg">
										<button
											onClick={() => handleEdit(doc)}
											className="text-yellow-400"
										>
											✏️
										</button>
										<button
											onClick={() => handleDelete(doc.id)}
											className="text-red-500"
										>
											🗑️
										</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	);
}