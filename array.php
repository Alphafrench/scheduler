<?php
/**
 * Calculate gross pay by adding base pay and allowances
 * 
 * @param float $basePay The employee's base pay
 * @param float $allowances The employee's total allowances
 * @return float The calculated gross pay
 */
function calculateGrossPay($basePay, $allowances) {
    return $basePay + $allowances;
}

/**
 * Calculate total deductions including tax, loans, insurance, PhilHealth, and SSS
 * 
 * @param float $basePay The employee's base pay
 * @param string $civilStatus The employee's civil status ('single' or 'married')
 * @param float $loans The employee's loan deductions
 * @param float $insurance The employee's insurance deductions
 * @param float $philhealth The employee's PhilHealth contribution
 * @param float $sss The employee's SSS contribution
 * @return float The total deductions
 */
function calculateDeductions($basePay, $civilStatus, $loans, $insurance, $philhealth, $sss) {
    // Calculate tax based on civil status
    if (strtolower($civilStatus) == 'single') {
        $tax = $basePay * 0.25; // 25% tax for single employees
    } else if (strtolower($civilStatus) == 'married') {
        $tax = $basePay * 0.15; // 15% tax for married employees
    } else {
        // Default to single rate if status is unrecognized
        $tax = $basePay * 0.25;
    }
    
    // Sum all deductions
    $totalDeductions = $tax + $loans + $insurance + $philhealth + $sss;
    
    return $totalDeductions;
}

/**
 * Calculate net pay by subtracting deductions from gross pay
 * 
 * @param float $grossPay The employee's gross pay
 * @param float $deductions The employee's total deductions
 * @return float The calculated net pay
 */
function calculateNetPay($grossPay, $deductions) {
    return $grossPay - $deductions;
}

// Example usage of the functions
function processPayroll($basePay, $allowances, $civilStatus, $loans, $insurance, $philhealth, $sss) {
    // Calculate gross pay
    $grossPay = calculateGrossPay($basePay, $allowances);
    
    // Calculate deductions
    $deductions = calculateDeductions($basePay, $civilStatus, $loans, $insurance, $philhealth, $sss);
    
    // Calculate net pay
    $netPay = calculateNetPay($grossPay, $deductions);
    
    // Return all results in an array
    return [
        'Base Pay' => $basePay,
        'Allowances' => $allowances,
        'Gross Pay' => $grossPay,
        'Civil Status' => $civilStatus,
        'Tax' => ($civilStatus == 'single' ? $basePay * 0.25 : $basePay * 0.15),
        'Loans' => $loans,
        'Insurance' => $insurance,
        'PhilHealth' => $philhealth,
        'SSS' => $sss,
        'Total Deductions' => $deductions,
        'Net Pay' => $netPay
    ];
}

// Example: Single employee
$singleEmployeePayroll = processPayroll(
    basePay: 30000,      // Base pay
    allowances: 5000,     // Allowances
    civilStatus: 'single', // Civil status
    loans: 2000,          // Loans
    insurance: 1500,      // Insurance
    philhealth: 500,      // PhilHealth
    sss: 1200             // SSS
);

// Example: Married employee
$marriedEmployeePayroll = processPayroll(
    basePay: 30000,       // Base pay
    allowances: 5000,      // Allowances
    civilStatus: 'married', // Civil status
    loans: 2000,           // Loans
    insurance: 1500,       // Insurance
    philhealth: 500,       // PhilHealth
    sss: 1200              // SSS
);

// Display the results
echo "<h2>Single Employee Payroll</h2>";
echo "<pre>";
print_r($singleEmployeePayroll);
echo "</pre>";

echo "<h2>Married Employee Payroll</h2>";
echo "<pre>";
print_r($marriedEmployeePayroll);
echo "</pre>";
?>