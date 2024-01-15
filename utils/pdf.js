require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const nodemailer = require('nodemailer')
const fs = require('fs')

const PDF_PUBLIC_FOLDER_PATH = process.env.PDF_PUBLIC_FOLDER_PATH;
const PDF_PUBLIC_PATH = process.env.PDF_PUBLIC_PATH;
const PUBLISH_BASE_URL = process.env.PUBLISH_BASE_URL;
const IMAGE_PUBLIC_FOLDER_PATH = process.env.IMAGE_PUBLIC_FOLDER_PATH;
const IMAGE_PUBLIC_PATH = process.env.IMAGE_PUBLIC_PATH;
const EMAIL_HOST = process.env.EMAIL_HOST // email provider 
const MANAGER_EMAIL = process.env.MANAGER_EMAIL // email reciver
const SUPERVISOR_EMAIL = process.env.SUPERVISOR_EMAIL // email reciver
const EMAIL_FROM = process.env.EMAIL_FROM // email sender user
const EMAIL_PASS_WORD = process.env.EMAIL_PASS_WORD // email sender password

const getTimeFormat = (time) => {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

const namesDiv = (names) => {
    let divs = ""
    names.forEach(name => {
        divs += `<p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
        center;line-height:normal'><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
        color:black'>&nbsp;<span lang=AR-SA dir=RTL>${name.name}</span></span></p>`
    })
    return divs
}

const categoryHead = (category) => {
    return `<tr style='height:.2in'>
    <td width=28 nowrap style='width:21.3pt;border:solid windowtext 1.0pt;
    border-top:none;background:#D6DCE4;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><b><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>no</span></b></p>
    </td>
    <td width=297 nowrap style='width:222.9pt;border-top:none;border-left:solid black 1.0pt;
    border-bottom:solid windowtext 1.0pt;border-right:none;background:#D6DCE4;
    padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><b><span
    lang=AR-SA style='font-size:10.0pt;color:black'>${category}</span></b></p>
    </td>
    <td width=96 style='width:1.0in;border-top:none;border-left:solid windowtext 1.0pt;
    border-bottom:solid windowtext 1.0pt;border-right:none;background:#D6DCE4;
    padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><b><span
    lang=AR-SA style='font-size:10.0pt;color:black'>&#1575;&#1604;&#1593;&#1604;&#1575;&#1605;&#1577;
    </span></b></p>
    </td>
    <td width=101 nowrap style='width:76.1pt;border-top:none;border-left:solid windowtext 1.0pt;
    border-bottom:solid windowtext 1.0pt;border-right:none;background:#D6DCE4;
    padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><b><span
    lang=AR-SA style='font-size:10.0pt;color:black'>&#1575;&#1604;&#1578;&#1602;&#1610;&#1610;&#1605;</span></b></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>`
}

const categoryQuestion = (questionDetail) => {
    return`<tr style='height:.2in'>
    <td width=28 nowrap style='width:21.3pt;border:solid windowtext 1.0pt;
    border-top:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><b><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>${questionDetail.id + 1}</span></b></p>
    </td>
    <td width=297 style='width:222.9pt;border-top:none;border-left:solid windowtext 1.0pt;
    border-bottom:solid windowtext 1.0pt;border-right:none;padding:0in 5.4pt 0in 5.4pt;
    height:.8in'>
    <p class=MsoNormal dir=RTL style='margin-bottom:0in;text-align:right;
    line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;color:black'>${questionDetail.question}</span></p>
    </td>
    <td width=96 nowrap valign=bottom style='width:1.0in;border-top:none;
    border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>${questionDetail.score}</span></p>
    </td>
    <td width=101 nowrap valign=bottom style='width:76.1pt;border-top:none;
    border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span lang=AR-SA dir=RTL style='font-size:10.0pt;
    font-family:"Calibri Light",sans-serif;color:black'>${questionDetail.maxGrade}</span></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>`
}

const qustionNote = (note) => {
    return`<tr style='height:.2in'>
    <td width=523 wrap colspan=4 style='width:392.3pt;border:solid windowtext 1.0pt;
    border-top:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=right dir=LTR style='margin-bottom:0in;text-align:
    right;line-height:normal'><b><span lang=AR-SA dir=RTL style='font-size:10.0pt;
    font-family:"Calibri Light",sans-serif;color:black'>&#1605;&#1604;&#1575;&#1581;&#1592;&#1577;: ${note}</span></b></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>`
}

const categoryTotal = (questionTotal,questionTotalMax) => {
    return`<tr style='height:.2in'>
    <td width=28 nowrap style='width:21.3pt;border:solid windowtext 1.0pt;
    background:#D6DCE4;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><b><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'></span></b></p>
    </td>
    <td width=297 style='width:222.9pt;border-top:solid windowtext 1.0pt;
    border-left:solid black 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;background:#D6DCE4;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><b><span
    lang=AR-SA style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>&#1575;&#1604;&#1605;&#1580;&#1605;&#1608;&#1593;</span></b></p>
    </td>
    <td width=96 nowrap style='width:1.0in;border:solid windowtext 1.0pt;
    border-right:none;background:#D6DCE4;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><b><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>${questionTotal}</span></b></p>
    </td>
    <td width=101 nowrap style='width:76.1pt;border:solid windowtext 1.0pt;
    border-right:none;background:#D6DCE4;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span dir=LTR></span><b><span style='font-size:
    10.0pt;font-family:"Calibri Light",sans-serif;color:black'><span dir=LTR></span>${questionTotalMax}</span></b></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>`
}

const categoryNote = (note) => {
    return`<tr style='height:.2in'>
    <td width=523 wrap colspan=4 style='width:392.3pt;border:solid windowtext 1.0pt;
    border-top:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=right dir=LTR style='margin-bottom:0in;text-align:
    right;line-height:normal'><b><span lang=AR-SA dir=RTL style='font-size:10.0pt;
    font-family:"Calibri Light",sans-serif;color:black'>&#1605;&#1604;&#1575;&#1581;&#1592;&#1577;: ${note}</span></b></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>`
}

const categoriesDiv = (categoriesDetails) => {
    let divs = ''
    let total = 0
    let maxTotal = 0
    categoriesDetails.forEach(category => {
        let detail = ""
        detail += categoryHead(category.name)
        category.questions.forEach((question,index) => {
            if(index < category.questions.length -1){
                detail += categoryQuestion(question)
                if(question.note != '' && question.note != undefined){
                    detail += qustionNote(question.note)
                }
            }
        })
        detail += categoryTotal(category.total,category.maxTotal)
        total += category.total
        maxTotal += category.maxTotal
        let note = 'لا يوجد'
        if(category.note == '' | category.note == undefined){
            note = 'لا يوجد'
        }else{
            note = category.note
        }
        detail += categoryNote(note)
        divs += detail
    })
    divs += categoryTotal(total,maxTotal)
    return divs
}

const addImages = (links) => {
    if(links){
        let data = ''
        links.forEach(link => {
            data += `<tr style='height:.2in'>
            <td width=523 nowrap colspan=4 style='width:392.3pt;border:solid windowtext 1.0pt;
            border-top:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
              <img height="300" width="350" style="background-size:cover;padding:10px;" src="${link}" />
            </td>
            <td style='height:.2in;border:none' width=0 height=24></td>
           </tr>`
        })
        return data
    }
}

const createHTML = (data,imgLinks) => {
    return `
    <html>
    <head>
    <meta http-equiv=Content-Type content="text/html; charset=windows-1252">
    <meta name=Generator content="Microsoft Word 15 (filtered)">
    <style>
    <!--
    /* Font Definitions */
    @font-face
        {font-family:"Cambria Math";
        panose-1:2 4 5 3 5 4 6 3 2 4;}
    @font-face
        {font-family:Calibri;
        panose-1:2 15 5 2 2 2 4 3 2 4;}
    @font-face
        {font-family:"Calibri Light";
        panose-1:2 15 3 2 2 2 4 3 2 4;}
    /* Style Definitions */
    p.MsoNormal, li.MsoNormal, div.MsoNormal
        {margin-top:0in;
        margin-right:0in;
        margin-bottom:8.0pt;
        margin-left:0in;
        line-height:107%;
        font-size:11.0pt;
        font-family:"Calibri",sans-serif;}
    .MsoChpDefault
        {font-family:"Calibri",sans-serif;}
    .MsoPapDefault
        {margin-bottom:8.0pt;
        line-height:107%;}
    @page WordSection1
        {size:8.5in 11.0in;
        margin:1.0in 1.0in 1.0in 1.0in;}
    div.WordSection1
        {page:WordSection1;}
    -->
    </style>

    </head>

    <body lang=EN-US style='word-wrap:break-word'>

    <div class=WordSection1>

    <div align=right>

    <table class=MsoNormalTable dir=rtl border=0 cellspacing=0 cellpadding=0
    align=right width=523 style='width:392.3pt;border-collapse:collapse;
    margin-left:6.75pt;margin-right:6.75pt'>
    <tr style='height:.2in'>
    <td width=523 nowrap colspan=4 style='width:392.3pt;border:solid windowtext 1.0pt;
    background:#ACB9CA;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><b><span
    lang=AR-SA style='font-size:10.0pt;color:black'>&#1601;&#1585;&#1608;&#1593;
    &#1575;&#1604;&#1585;&#1610;&#1581;&#1575;&#1606; - </span></b><b><span
    dir=LTR style='font-size:10.0pt;color:black'>CHECK List</span></b></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    <tr style='height:.2in'>
    <td width=326 nowrap colspan=2 valign=bottom style='width:244.2pt;border:
    solid windowtext 1.0pt;border-top:none;padding:0in 5.4pt 0in 5.4pt;
    height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;color:black'>&#1575;&#1604;&#1578;&#1575;&#1585;&#1610;&#1582;
    - &#1575;&#1604;&#1610;&#1608;&#1605;</span></p>
    </td>
    <td width=197 nowrap colspan=2 valign=bottom style='width:148.1pt;border-top:
    none;border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span dir=LTR></span><span style='font-size:10.0pt;
    font-family:"Calibri Light",sans-serif;color:black'><span dir=LTR></span>&nbsp;${new Date(data.date).toISOString().split('T')[0]}</span></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    <tr style='height:.2in'>
    <td width=326 nowrap colspan=2 valign=bottom style='width:244.2pt;border:
    solid windowtext 1.0pt;border-top:none;padding:0in 5.4pt 0in 5.4pt;
    height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-JO
    style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;color:black'>&#1575;&#1604;&#1587;&#1575;&#1593;&#1577;</span></p>
    </td>
    <td width=197 nowrap colspan=2 valign=bottom style='width:148.1pt;border-top:
    none;border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span dir=LTR></span><span style='font-size:10.0pt;
    font-family:"Calibri Light",sans-serif;color:black'><span dir=LTR></span>${getTimeFormat(new Date(data.time))}</span></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    <tr style='height:.2in'>
    <td width=326 nowrap colspan=2 valign=bottom style='width:244.2pt;border:
    solid windowtext 1.0pt;border-top:none;padding:0in 5.4pt 0in 5.4pt;
    height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;color:black'>&#1575;&#1604;&#1601;&#1585;&#1593;</span></p>
    </td>
    <td width=197 nowrap colspan=2 valign=bottom style='width:148.1pt;border-top:
    none;border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>&nbsp;</span><span lang=AR-JO dir=RTL style='font-size:10.0pt;
    font-family:"Calibri Light",sans-serif;color:black'>${data.branchValue}</span></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    <tr style='height:.2in'>
    <td width=326 nowrap colspan=2 valign=bottom style='width:244.2pt;border:
    solid windowtext 1.0pt;border-top:none;padding:0in 5.4pt 0in 5.4pt;
    height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;color:black'>&#1593;&#1583;&#1583;
    &#1605;&#1608;&#1592;&#1601;&#1610; &#1575;&#1604;&#1601;&#1585;&#1593;</span></p>
    </td>
    <td width=197 nowrap colspan=2 valign=bottom style='width:148.1pt;border-top:
    none;border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;
    color:black'>&nbsp;<span dir=RTL></span><span lang=AR-SA dir=RTL><span
    dir=RTL></span>${data.names.length}</span></span></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    <tr style='height:22.5pt'>
    <td width=326 nowrap colspan=2 rowspan=2 style='width:244.2pt;border:solid windowtext 1.0pt;
    border-top:none;padding:0in 5.4pt 0in 5.4pt;height:22.5pt'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;font-family:"Calibri Light",sans-serif;color:black'>&#1571;&#1587;&#1605;&#1575;&#1569;
    &#1605;&#1608;&#1592;&#1601;&#1610; &#1575;&#1604;&#1601;&#1585;&#1593;
    &#1593;&#1606;&#1583; &#1575;&#1604;&#1586;&#1610;&#1575;&#1585;&#1577;</span></p>
    </td>
    <td width=197 nowrap colspan=2 rowspan=2 valign=bottom style='width:148.1pt;
    border-top:none;border-left:solid windowtext 1.0pt;border-bottom:solid windowtext 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:22.5pt'>
    ${namesDiv(data.names)}
    </td>
    <td style='height:22.5pt;border:none' width=0 height=38></td>
    </tr>
    <tr style='height:22.5pt'>
    <td style='height:22.5pt;border:none' width=0 height=38></td>
    </tr>
    <tr style='height:.2in'>
    <td width=523 nowrap colspan=4 style='width:392.3pt;border:solid windowtext 1.0pt;
    border-top:none;background:#ACB9CA;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=RTL style='margin-bottom:0in;text-align:
    center;line-height:normal;direction:rtl;unicode-bidi:embed'><b><span
    lang=AR-SA style='font-size:10.0pt;color:black'>&#1605;&#1593;&#1575;&#1610;&#1610;&#1585;
    &#1575;&#1604;&#1578;&#1602;&#1610;&#1610;&#1605;</span></b></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    ${categoriesDiv(data.allCatData)}
    ${addImages(imgLinks)}
    <tr style='height:.2in'>
    <td width=28 nowrap valign=bottom style='width:21.3pt;border:solid windowtext 1.0pt;
    border-top:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=right dir=LTR style='margin-bottom:0in;text-align:
    right;line-height:normal'><span style='font-size:10.0pt;color:black'>&nbsp;</span></p>
    </td>
    <td width=297 nowrap style='width:222.9pt;border-top:none;border-left:solid black 1.0pt;
    border-bottom:solid windowtext 1.0pt;border-right:none;padding:0in 5.4pt 0in 5.4pt;
    height:.2in'>
    <p class=MsoNormal dir=RTL style='margin-bottom:0in;text-align:right;
    line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;color:black'>&#1575;&#1587;&#1605;
    &#1608;&#1578;&#1608;&#1602;&#1610;&#1593; /
    &#1575;&#1604;&#1578;&#1583;&#1602;&#1610;&#1602;
    &#1575;&#1604;&#1583;&#1575;&#1582;&#1604;&#1610;</span></p>
    </td>
    <td width=197 nowrap colspan=2 rowspan=2 valign=bottom style='width:148.1pt;
    border-top:none;border-left:solid windowtext 1.0pt;border-bottom:solid black 1.0pt;
    border-right:none;padding:0in 5.4pt 0in 5.4pt;height:.2in'>
    <p class=MsoNormal align=center dir=LTR style='margin-bottom:0in;text-align:
    center;line-height:normal'><span style='font-size:10.0pt;color:black'>&nbsp;</span></p>
    </td>
    <td style='height:.2in;border:none' width=0 height=24></td>
    </tr>
    <tr style='height:15.0pt'>
    <td width=28 nowrap valign=bottom style='width:21.3pt;border:solid windowtext 1.0pt;
    border-top:none;padding:0in 5.4pt 0in 5.4pt;height:15.0pt'>
    <p class=MsoNormal align=right dir=LTR style='margin-bottom:0in;text-align:
    right;line-height:normal'><span style='font-size:10.0pt;color:black'>&nbsp;</span></p>
    </td>
    <td width=297 nowrap style='width:222.9pt;border-top:none;border-left:solid black 1.0pt;
    border-bottom:solid windowtext 1.0pt;border-right:none;padding:0in 5.4pt 0in 5.4pt;
    height:15.0pt'>
    <p class=MsoNormal dir=RTL style='margin-bottom:0in;text-align:right;
    line-height:normal;direction:rtl;unicode-bidi:embed'><span lang=AR-SA
    style='font-size:10.0pt;color:black'>&#1575;&#1587;&#1605;
    &#1608;&#1578;&#1608;&#1602;&#1610;&#1593; /
    &#1605;&#1587;&#1572;&#1608;&#1604; &#1575;&#1604;&#1601;&#1585;&#1593;</span></p>
    </td>
    <td style='height:15.0pt;border:none' width=0 height=25></td>
    </tr>
    </table>

    </div>

    <p class=MsoNormal>&nbsp;</p>

    </div>

    </body>

    </html>
    `;
}

const createPDF = async (htmlString, pdfFilePath) => {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: "networkidle0" });
    await page.pdf({ path: pdfFilePath, format: "A4" });
    await browser.close();
};

const sendEmail = (text,toEmail,branch) => {
    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth : {
            user : EMAIL_FROM,
            pass : EMAIL_PASS_WORD
        },
        tls: { 
            minVersion: 'TLSv1', // -> This is the line that solved my problem
            rejectUnauthorized: false,
        }
    });
    const emailOptions = {
        from : EMAIL_FROM,
        to : toEmail,
        subject : `new rate for (${branch})`,
        text: text
    }
    transporter.sendMail(emailOptions,(error,info) => {
        if (error){
            console.log(error)
        }
    })
}

const saveImages = async(files) => {
    let links = []
    const promises = []
    files.forEach(file => {
        promises.push(fs.writeFileSync(`${IMAGE_PUBLIC_FOLDER_PATH}/(${new Date().getTime()}).jpeg`, file.buffer));
        links.push(PUBLISH_BASE_URL + IMAGE_PUBLIC_PATH + `/(${new Date().getTime()}).jpeg`)
    })
    await Promise.all(promises)
    return links
} 

const getPDFLink = async(data,files) => {
    try{
        const time = new Date().getTime()
        let imgLinks
        if(files.length > 0){
            imgLinks = await saveImages(files)
        }
        const pdfPath = path.join(PDF_PUBLIC_FOLDER_PATH, `${data.branchValue}(${time}).pdf`);
        const pdfPublicPath = PDF_PUBLIC_PATH +`/${data.branchValue}(${time}).pdf`;
        const htmlContent = createHTML(data,imgLinks);
        await createPDF(htmlContent, pdfPath)
        const link = PUBLISH_BASE_URL+pdfPublicPath
        sendEmail(link,MANAGER_EMAIL,data.branchValue)
        sendEmail(link,SUPERVISOR_EMAIL,data.branchValue)
    }catch(err){
        console.log(err)
    }
}

module.exports = getPDFLink