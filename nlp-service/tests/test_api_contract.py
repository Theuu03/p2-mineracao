import unittest

from pydantic import ValidationError

from app.main import TextRequest, app


class ApiContractTests(unittest.TestCase):
    def test_openapi_documents_all_available_operations(self):
        paths = app.openapi()["paths"]
        self.assertTrue({"/health", "/v1/tokenize", "/v1/frequency", "/v1/similarity", "/v1/tfidf", "/v1/topics", "/v1/sentiment-baseline"}.issubset(paths))

    def test_text_payload_is_bounded(self):
        with self.assertRaises(ValidationError):
            TextRequest(text="x" * 5_001)


if __name__ == "__main__":
    unittest.main()
