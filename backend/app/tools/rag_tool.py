"""RAG tool for document retrieval and augmented generation."""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class RAGService:
    """Retrieval Augmented Generation service using ChromaDB."""

    def __init__(self, chroma_host: str = "localhost", chroma_port: int = 8000, collection_name: str = "nova_documents"):
        self.chroma_host = chroma_host
        self.chroma_port = chroma_port
        self.collection_name = collection_name
        self._client = None
        self._collection = None

    def _get_client(self):
        """Lazy initialization of ChromaDB client."""
        if self._client is None:
            try:
                import chromadb

                self._client = chromadb.HttpClient(host=self.chroma_host, port=self.chroma_port)
                self._collection = self._client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"},
                )
            except Exception as e:
                logger.error(f"ChromaDB connection failed: {e}")
                raise
        return self._client, self._collection

    async def add_document(self, doc_id: str, text: str, metadata: Optional[dict] = None) -> bool:
        """Add a document chunk to the vector store."""
        try:
            _, collection = self._get_client()
            collection.add(
                ids=[doc_id],
                documents=[text],
                metadatas=[metadata or {}],
            )
            return True
        except Exception as e:
            logger.error(f"Failed to add document: {e}")
            return False

    async def query(self, query_text: str, n_results: int = 5, category: Optional[str] = None) -> list[dict]:
        """Query the vector store for relevant documents."""
        try:
            _, collection = self._get_client()

            where_filter = None
            if category:
                where_filter = {"category": category}

            results = collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where_filter,
            )

            documents = []
            if results and results["documents"]:
                for i, doc in enumerate(results["documents"][0]):
                    documents.append({
                        "content": doc,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i] if results["distances"] else None,
                    })

            return documents
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return []

    async def ingest_pdf(self, file_path: str, metadata: Optional[dict] = None) -> int:
        """Ingest a PDF file by chunking and adding to vector store."""
        try:
            from pypdf import PdfReader

            reader = PdfReader(file_path)
            chunk_size = 500
            chunks_added = 0

            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if not text:
                    continue

                # Simple chunking by character count
                words = text.split()
                current_chunk = []
                current_length = 0

                for word in words:
                    current_chunk.append(word)
                    current_length += len(word) + 1

                    if current_length >= chunk_size:
                        chunk_text = " ".join(current_chunk)
                        doc_id = f"{file_path}_p{page_num}_c{chunks_added}"
                        chunk_meta = {**(metadata or {}), "page": page_num, "source": file_path}
                        await self.add_document(doc_id, chunk_text, chunk_meta)
                        current_chunk = []
                        current_length = 0
                        chunks_added += 1

                # Add remaining text
                if current_chunk:
                    chunk_text = " ".join(current_chunk)
                    doc_id = f"{file_path}_p{page_num}_c{chunks_added}"
                    chunk_meta = {**(metadata or {}), "page": page_num, "source": file_path}
                    await self.add_document(doc_id, chunk_text, chunk_meta)
                    chunks_added += 1

            logger.info(f"Ingested {chunks_added} chunks from {file_path}")
            return chunks_added
        except Exception as e:
            logger.error(f"PDF ingestion failed: {e}")
            return 0
