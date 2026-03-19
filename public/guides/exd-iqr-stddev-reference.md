# IQR & Standard Deviation Reference Guide

---

## Interquartile Range (IQR)

The **Interquartile Range (IQR)** measures the spread of the middle 50% of a data set. It removes the influence of extreme values (outliers) and focuses on where most data falls.

### General Process

1. **Sort** the data from smallest to largest.
2. **Find the median (Q2)** — the middle value of the entire data set.
3. **Find Q1** — the median of the lower half of the data (values below Q2).
4. **Find Q3** — the median of the upper half of the data (values above Q2).
5. **Calculate IQR:**

$$\text{IQR} = Q3 - Q1$$

*Include units.*

---

### IQR Example

**Data set (5 values):** 4, 8, 15, 22, 30

**Step 1 — Sort the data:**  
4, 8, 15, 22, 30  *(already sorted)*

**Step 2 — Find the median (Q2):**  
Q2 = 15 (the middle value)

**Step 3 — Find Q1:**  
Lower half = 4, 8  
Q1 = (4 + 8) / 2 = **6**

**Step 4 — Find Q3:**  
Upper half = 22, 30  
Q3 = (22 + 30) / 2 = **26**

**Step 5 — Calculate IQR:**

$$\text{IQR} = 26 - 6 = \boxed{20}$$

*The middle 50% of the data spans 20 units.*

---

## Standard Deviation

**Standard deviation** measures how spread out the data values are from the mean. A small standard deviation means data points are close to the mean; a large one means they are spread out.

### General Formula (Sample)

$$s = \sqrt{\frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n - 1}}$$

| Symbol | Meaning |
|:------:|:-------:|
| $x_i$  | Each data value |
| $\bar{x}$ | Mean of the data set |
| $n$    | Number of data values |
| $s$    | Sample standard deviation |

> **Why $n - 1$?** When working with a *sample* (a subset of all possible data), dividing by $n - 1$ instead of $n$ corrects for the tendency of a sample to underestimate the true spread. This adjustment is called **Bessel's correction**.

### General Process

1. **Calculate the mean** $(\bar{x})$ of the data set.
2. **Subtract the mean** from each data value to find each deviation $(x_i - \bar{x})$.
3. **Square** each deviation $(x_i - \bar{x})^2$.
4. **Sum** the squared deviations and **divide by $n - 1$**.
5. **Take the square root** of the result.

*Include units.*

---

### Standard Deviation Example

**Data set (5 values):** 4, 8, 15, 22, 30

**Step 1 — Calculate the mean:**

$$\bar{x} = \frac{4 + 8 + 15 + 22 + 30}{5} = \frac{79}{5} = 15.8$$

**Step 2 & 3 — Find deviations and square them:**

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 4      | −11.8            | 139.24               |
| 8      | −7.8             | 60.84                |
| 15     | −0.8             | 0.64                 |
| 22     | 6.2              | 38.44                |
| 30     | 14.2             | 201.64               |

**Step 4 — Sum of squared deviations divided by $n - 1$:**

$$\frac{139.24 + 60.84 + 0.64 + 38.44 + 201.64}{5 - 1} = \frac{440.80}{4} = 110.20$$

**Step 5 — Square root:**

$$s = \sqrt{110.20} \approx \boxed{10.50}$$

*On average, the data values are about 10.50 units from the mean.*

---

## Quick-Reference Summary

| Statistic | What It Tells You | Formula / Key Idea |
|-----------|--------------------|--------------------|
| **IQR**   | Spread of the middle 50% of data | $Q3 - Q1$ |
| **Standard Deviation** | Average distance of each value from the mean | $s = \sqrt{\frac{\sum(x_i - \bar{x})^2}{n - 1}}$ |

---

## Calculation Templates

**Data:** $x_1,\ x_2,\ x_3,\ x_4,\ x_5$ — **Sorted:** $a \leq b \leq c \leq d \leq e$

### IQR

| Step | Action |
|:----:|:------:|
| 1 | Sort data smallest → largest |
| 2 | Q2 (median) = $c$ |
| 3 | Q1 = median of lower half |
| 4 | Q3 = median of upper half |
| 5 | IQR $= Q3 - Q1$ |

### Standard Deviation

| Step | Action |
|:----:|:------:|
| 1 | Mean $= \frac{x_1 + x_2 + \cdots + x_n}{n}$ |
| 2 | Deviations $= x_i - \bar{x}$ |
| 3 | Square each deviation |
| 4 | Sum of squared deviations $\div\ (n - 1)$ |
| 5 | $s = \sqrt{\text{result from Step 4}}$ |

---
