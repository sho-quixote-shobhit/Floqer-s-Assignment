import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Box, Text } from '@chakra-ui/react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
} from '@chakra-ui/react';
import { ArrowDownIcon } from '@chakra-ui/icons';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const MainTable = ({ onSelectYear }) => {
    const [data, setData] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'work_year', direction: 'ascending' });
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetch('/salaries.csv')
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    complete: (results) => {
                        const processedData = processCsvData(results.data);
                        setData(processedData);
                        setChartData(createChartData(processedData));
                    },
                });
            })
            .catch(error => console.error('Error fetching the CSV file:', error));
    }, []);

    const processCsvData = (data) => {
        const groupedByYear = {};

        data
            .filter(row => row.work_year && row.job_title && row.salary_in_usd)
            .forEach(row => {
                const { work_year, job_title, salary_in_usd } = row;

                if (!groupedByYear[work_year]) {
                    groupedByYear[work_year] = {
                        totalJobs: new Set(),
                        totalSalary: 0,
                        count: 0,
                    };
                }

                groupedByYear[work_year].totalJobs.add(job_title);
                groupedByYear[work_year].totalSalary += parseFloat(salary_in_usd);
                groupedByYear[work_year].count += 1;
            });

        const transformedData = [];
        for (const year in groupedByYear) {
            const yearData = groupedByYear[year];
            transformedData.push({
                work_year: year,
                totalJobs: yearData.totalJobs.size,
                averageSalary: yearData.totalSalary / yearData.count,
            });
        }

        return transformedData;
    };

    const createChartData = (data) => {
        const labels = data.map(item => item.work_year);
        const totalJobsData = data.map(item => item.totalJobs);
        const averageSalaryData = data.map(item => item.averageSalary.toFixed(2));

        return {
            labels,
            datasets: [
                {
                    label: 'Total Jobs',
                    data: totalJobsData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    yAxisID: 'y1',
                },
                {
                    label: 'Average Salary (USD)',
                    data: averageSalaryData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    yAxisID: 'y2',
                },
            ],
        };
    };

    const sortedData = [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <Box w={{ base: '100%', md: '80%' }} m='auto auto'>
            <Text fontSize='3xl'>Main Table</Text>

            {/* main table */}
            <Box w={{ base: '100%', md: '70%' }} m='auto auto'>
                <TableContainer mt={5} border='1px solid black' p={3} borderRadius='10px'>
                    <Table variant='simple'>
                        <Thead>
                            <Tr>
                                <Th fontSize='xl' display='flex' alignItems='center'>Year
                                    <ArrowDownIcon cursor='pointer' onClick={() => requestSort('work_year')} w={5} borderRadius='5px' ml={1} h={5} mr={2} border="1px solid black" />
                                </Th>
                                <Th fontSize='xl'>Total_jobs
                                    <ArrowDownIcon cursor='pointer' onClick={() => requestSort('totalJobs')} w={5} borderRadius='5px' ml={1} h={5} mr={2} border="1px solid black" />
                                </Th>
                                <Th fontSize='xl' isNumeric>Avg Salary (USD)
                                    <ArrowDownIcon cursor='pointer' onClick={() => requestSort('averageSalary')} w={5} borderRadius='5px' ml={1} h={5} mr={2} border="1px solid black" />
                                </Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {sortedData && sortedData.map((row, index) => {
                                return (
                                    <Tr key={index}
                                        cursor='pointer'
                                        transition="transform 0.3s ease-in-out"
                                        _hover={{ transform: 'scale(1.02)', bg: '#ADD8E6' }}
                                        onClick={() => { onSelectYear(row.work_year) }}
                                    >
                                        <Td>{row.work_year}</Td>
                                        <Td>{row.totalJobs}</Td>
                                        <Td isNumeric>{row.averageSalary.toFixed(2)}</Td>
                                    </Tr>
                                )
                            })}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            {/* chart */}
            <Box w={{ base: '100%', md: '50%' }} m='auto auto' mt={5} display='flex' justifyContent='center'>
                {chartData && chartData.labels && chartData.labels.length > 0 ? (
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            scales: {
                                y1: {
                                    type: 'linear',
                                    position: 'left',
                                    title: {
                                        display: true,
                                        text: 'Total Jobs',
                                    },
                                },
                                y2: {
                                    type: 'linear',
                                    position: 'right',
                                    title: {
                                        display: true,
                                        text: 'Average Salary (USD)',
                                    },
                                    grid: {
                                        drawOnChartArea: false,
                                    },
                                },
                            },
                        }}
                    />
                ) : (
                    <Text>No data available for chart</Text>
                )}
            </Box>
        </Box>
    );
};

export default MainTable;
