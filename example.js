fetch('http://localhost:3000/api/redeem', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        voucherCode: 'https://gift.truemoney.com/campaign/?v=VOUCHER_CODE',
        mobileNumber: 'PHONE_NUMBER'
    })
})
.then(response => response.json())
.then(data => console.log(data));