import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Box, Text, Spinner, Center } from '@chakra-ui/react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
} from '@chakra-ui/react'
import { ArrowDownIcon } from '@chakra-ui/icons';

const CsvDisplay = ({ year }) => {
    const [groupedData, setGroupedData] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'job_title', direction: 'ascending' });
    const [loading, setloading] = useState(false);

    useEffect(() => {
        if (!year) {
            return;
        }
        setloading(true);
        fetch('/salaries.csv')
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    complete: (results) => {
                        const processedData = processCsvData(results.data, year);
                        setGroupedData(processedData);
                    },
                });
            })
            .catch(error => console.error('Error fetching the CSV file:', error));
    }, [year]);

    const processCsvData = (data, filterYear) => {
        const groupedByYear = {};

        data
            .filter(row => row.work_year === filterYear.toString() && row.job_title && row.salary_in_usd)
            .forEach(row => {
                const { job_title, salary_in_usd } = row;

                if (!groupedByYear[filterYear]) {
                    groupedByYear[filterYear] = {};
                }

                if (!groupedByYear[filterYear][job_title]) {
                    groupedByYear[filterYear][job_title] = {
                        count: 0,
                        totalSalary: 0,
                    };
                }

                groupedByYear[filterYear][job_title].count += 1;
                groupedByYear[filterYear][job_title].totalSalary += parseFloat(salary_in_usd);
            });

        for (const title in groupedByYear[filterYear]) {
            groupedByYear[filterYear][title].averageSalary = groupedByYear[filterYear][title].totalSalary / groupedByYear[filterYear][title].count;
        }

        setloading(false);
        return groupedByYear;
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = Object.keys(groupedData[year] || {}).sort((a, b) => {
        const itemA = groupedData[year][a];
        const itemB = groupedData[year][b];
        if (sortConfig.key === 'job_title') {
            if (a < b) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (a > b) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else if (sortConfig.key === 'count') {
            if (itemA.count < itemB.count) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (itemA.count > itemB.count) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else if (sortConfig.key === 'averageSalary') {
            if (itemA.averageSalary < itemB.averageSalary) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (itemA.averageSalary > itemB.averageSalary) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return (
        <Box w={{ base: '100%', md: '80%' }} m='auto auto'>
            {groupedData[year] &&

                // yearly table
                <Box w={{ base: '100%', md: '70%' }} m='auto auto'>
                    <Center>{loading && <Spinner mt={5} />}</Center>
                    <Text mt={5} fontSize='3xl'>Year:{year}</Text>
                    <TableContainer border='1px solid black' p={3} borderRadius='10px'>
                        <Table variant='simple'>
                            <Thead>
                                <Tr>
                                    <Th fontSize='xl' display='flex' alignItems='center'>JOb Title
                                        <ArrowDownIcon cursor='pointer' onClick={() => { requestSort('job_title') }} w={5} borderRadius='5px' ml={1} h={5} mr={2} border="1px solid black" />
                                    </Th>
                                    <Th fontSize='xl'>Count
                                        <ArrowDownIcon cursor='pointer' onClick={() => { requestSort('count') }} w={5} borderRadius='5px' ml={1} h={5} mr={2} border="1px solid black" />
                                    </Th>
                                    <Th fontSize='xl' isNumeric>Avg Salary (USD)
                                        <ArrowDownIcon cursor='pointer' onClick={() => { requestSort('averageSalary') }} w={5} borderRadius='5px' ml={1} h={5} mr={2} border="1px solid black" />
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>

                                {sortedData && sortedData.map((title) => (
                                    <Tr key={title}>
                                        <Td>{title}</Td>
                                        <Td>{groupedData[year][title].count}</Td>
                                        <Td isNumeric>{groupedData[year][title].averageSalary.toFixed(2)}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>}
        </Box>
    );
};

export default CsvDisplay;
