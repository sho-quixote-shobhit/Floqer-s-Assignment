import React, { useState } from 'react';
import './App.css';
import CsvDisplay from './components/CsvDisplay';
import MainTable from './components/MainTable';

function App() {
	const [selectedYear, setSelectedYear] = useState(null);

	return (
		<div className="App">
			<MainTable onSelectYear={(year) => setSelectedYear(year)} />
			{selectedYear && <CsvDisplay year={selectedYear} />}
		</div>
	);
}

export default App;
