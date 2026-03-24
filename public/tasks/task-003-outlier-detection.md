# Outlier Detection Practice

## Overview

In experiments, an **outlier** is a data point that is unusually far from the other values. Outliers can result from measurement errors, equipment problems, or unusual experimental conditions. Identifying outliers helps you decide whether to investigate or exclude suspicious data.

In this task, you will:

1. Calculate the **variance** and **standard deviation** of a data set
2. Check for outliers using the **3s (three-standard-deviation)** method
3. Calculate the **interquartile range (IQR)**
4. Check for outliers using the **1.5IQR** method

---

## Your Data

A student tested how far a marble rolls after leaving a **25° ramp**. Five trials were performed at the same ramp angle:

| Trial | Distance (cm) |
|:-----:|:-------------:|
| 1     | 76.0          |
| 2     | 80.0          |
| 3     | 78.0          |
| 4     | 82.0          |
| 5     | 94.0          |

One of these values looks noticeably different from the rest. But is it a true **outlier** — or just normal variation? Use two different statistical methods to find out.

---

## Formulas & Methods

### Variance & Standard Deviation

$$s^2 = \frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n - 1} \qquad s = \sqrt{s^2}$$

| Symbol | Meaning |
|:------:|:--------|
| $x_i$ | Each data value |
| $\bar{x}$ | Mean of the data set |
| $n$ | Number of data values |
| $s^2$ | **Variance** (before the square root) |
| $s$ | **Standard deviation** (after the square root) |

### Outlier Detection — Standard Deviation (3s Rule)

A data point is considered an outlier if it falls **outside** the range:

$$\bar{x} - 3s \quad \text{to} \quad \bar{x} + 3s$$

Any value below $\bar{x} - 3s$ or above $\bar{x} + 3s$ is flagged as an outlier.

### Interquartile Range (IQR)

1. **Sort** the data from smallest to largest.
2. Find the **median (Q2)** — the middle value.
3. **Q1** = median of the lower half (for odd $n$, **exclude** the overall median from both halves).
4. **Q3** = median of the upper half.
5. **IQR** $= Q3 - Q1$

> **Example for odd $n$:** If your sorted data is {3, 7, 10, 15, 20}, the median is 10. The lower half is {3, 7}, so Q1 = (3 + 7) / 2 = 5. The upper half is {15, 20}, so Q3 = (15 + 20) / 2 = 17.5. IQR = 17.5 − 5 = 12.5.

### Outlier Detection — IQR Boundaries

A data point is an outlier if it falls **outside** the boundaries:

$$Q1 - 1.5 \times \text{IQR} \quad \text{to} \quad Q3 + 1.5 \times \text{IQR}$$

---

Report all numerical answers to **one decimal place**. Include units where prompted.
