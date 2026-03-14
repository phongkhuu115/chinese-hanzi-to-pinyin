import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { RandomVocabPage } from "@/pages/RandomVocabPage";
import { PinyinAssertionPage } from "@/pages/PinyinAssertionPage";
import { TestPage } from "@/pages/TestPage";
import { PinyinChartPage } from "@/pages/PinyinChartPage";
import { HskLevelsPage } from "@/pages/HskLevelsPage";
import { HskVocabListPage } from "@/pages/HskVocabListPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="vocab" element={<RandomVocabPage />} />
          <Route path="pinyin" element={<PinyinAssertionPage />} />
          <Route path="test" element={<TestPage />} />
          <Route path="chart" element={<PinyinChartPage />} />
          <Route path="vocab-list" element={<HskLevelsPage />} />
          <Route path="vocab-list/:level" element={<HskVocabListPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
