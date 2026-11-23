import unittest

from app.analysis import cosine_similarity, frequencies, sentiment_baseline, tfidf, tokenize, topic_model


class AnalysisTests(unittest.TestCase):
    def test_tokenizer_preserves_accented_words_and_negation(self):
        self.assertEqual(tokenize("Não há vacinação? COVID-19!"), ["não", "há", "vacinação", "covid", "19"])

    def test_frequency_is_deterministic_and_keeps_negation(self):
        result = frequencies("A vacina não protege. A vacina protege.")
        self.assertEqual(result["total_tokens"], 5)
        self.assertEqual(result["items"][0]["term"], "protege")
        self.assertEqual(result["items"][0]["count"], 2)
        self.assertAlmostEqual(sum(item["relative_frequency"] for item in result["items"]), 1.0)

    def test_bigram_frequency_uses_adjacent_tokens(self):
        result = frequencies("saúde pública saúde coletiva", exclude_stopwords=False, n=2)
        self.assertEqual({item["term"] for item in result["items"]}, {"saúde pública", "pública saúde", "saúde coletiva"})

    def test_tfidf_ranks_terms_per_document(self):
        result = tfidf(["vacina protege saúde", "vacina prevenção saúde"], top_terms=2)
        self.assertEqual(result["document_count"], 2)
        self.assertEqual(len(result["documents"]), 2)
        self.assertTrue(all(len(document) == 2 for document in result["documents"]))

    def test_cosine_similarity_bounds(self):
        same = cosine_similarity("vacina protege", "vacina protege")
        unrelated = cosine_similarity("vacina protege", "mar e montanha")
        self.assertAlmostEqual(same, 1.0)
        self.assertAlmostEqual(unrelated, 0.0)

    def test_sentiment_is_explicitly_a_lexicon_baseline(self):
        result = sentiment_baseline("A vacina protege, mas há medo")
        self.assertEqual(result["method"], "small Portuguese teaching lexicon")
        self.assertIn("warning", result)
        self.assertEqual(result["label"], "neutral_or_unknown")

    def test_topic_model_returns_requested_number_of_topics(self):
        result = topic_model([
            "vacina vacinação imunização saúde",
            "imunização vacina proteção saúde",
            "hospital sintomas tratamento doença",
            "doença hospital tratamento sintomas",
        ], topic_count=2, top_terms=3)
        self.assertEqual(len(result["topics"]), 2)
        self.assertEqual(len(result["document_topics"]), 4)


if __name__ == "__main__":
    unittest.main()
