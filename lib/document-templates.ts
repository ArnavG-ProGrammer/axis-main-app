export type DocType = 'NDA' | 'MOU' | 'PA'

export interface NDAFields {
  partyA: string
  partyB: string
  date: string
  duration: string
  jurisdiction: string
  purpose: string
  additionalClauses?: string
}

export interface MOUFields {
  partyA: string
  partyB: string
  date: string
  objective: string
  responsibilitiesA: string
  responsibilitiesB: string
  duration: string
  jurisdiction: string
}

export interface PAFields {
  partyA: string
  partyB: string
  effectiveDate: string
  scope: string
  revenueShare: string
  term: string
  noticePeriod: string
  jurisdiction: string
  additionalTerms?: string
}

export function generateNDAText(f: NDAFields): string {
  return `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of ${f.date} ("Effective Date") by and between:

${f.partyA} ("Disclosing Party / Party A")

and

${f.partyB} ("Receiving Party / Party B")

collectively referred to as the "Parties."

1. PURPOSE
The Parties wish to explore a potential business relationship concerning: ${f.purpose}. In connection with this purpose, each Party may disclose to the other certain confidential and proprietary information.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any data or information that is proprietary to the Disclosing Party and not generally known to the public, whether in tangible or intangible form, whenever and however disclosed, including but not limited to: (i) any marketing strategies, plans, financial information, or projections, operations, sales estimates, business plans and performance results; (ii) technical data, trade secrets, or know-how; (iii) any other information that should reasonably be recognized as confidential information of the Disclosing Party.

3. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
(a) Hold the Confidential Information in strict confidence;
(b) Not disclose the Confidential Information to any third parties without the prior written consent of the Disclosing Party;
(c) Use the Confidential Information solely for the Purpose described herein;
(d) Protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.

4. EXCLUSIONS
This Agreement does not apply to information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known by the Receiving Party before disclosure; (c) is independently developed by the Receiving Party without use of the Confidential Information; (d) is required to be disclosed by law or court order.

5. TERM
This Agreement shall remain in effect for a period of ${f.duration} from the Effective Date, unless terminated earlier by mutual written agreement of the Parties.

6. RETURN OF INFORMATION
Upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof.

7. NO LICENSE
Nothing in this Agreement grants the Receiving Party any rights in or to the Confidential Information except as expressly set forth herein.

8. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of ${f.jurisdiction}, without regard to its conflict of law provisions.

9. REMEDIES
Each Party acknowledges that any breach of this Agreement may cause irreparable harm for which monetary damages may be inadequate, and therefore the non-breaching Party shall be entitled to seek equitable relief in addition to all other remedies available at law.

${f.additionalClauses ? `10. ADDITIONAL CLAUSES\n${f.additionalClauses}\n` : ''}
IN WITNESS WHEREOF, the Parties have executed this Non-Disclosure Agreement as of the date first written above.

${f.partyA}                              ${f.partyB}

Signature: _______________________       Signature: _______________________

Name: ___________________________       Name: ___________________________

Title: ____________________________      Title: ____________________________

Date: ____________________________      Date: ____________________________`
}

export function generateMOUText(f: MOUFields): string {
  return `MEMORANDUM OF UNDERSTANDING

This Memorandum of Understanding ("MOU") is entered into as of ${f.date} by and between:

${f.partyA} ("Party A")

and

${f.partyB} ("Party B")

1. PURPOSE AND OBJECTIVE
The Parties enter into this MOU to outline their mutual understanding and intent to collaborate on the following objective:

${f.objective}

2. RESPONSIBILITIES OF PARTY A
${f.partyA} agrees to:
${f.responsibilitiesA}

3. RESPONSIBILITIES OF PARTY B
${f.partyB} agrees to:
${f.responsibilitiesB}

4. DURATION
This MOU shall be effective for a period of ${f.duration} from the date of execution, unless extended by mutual written agreement of both Parties.

5. NON-BINDING NATURE
This MOU is a statement of intent and does not create legally binding obligations between the Parties, unless separately executed in a formal agreement. Both Parties agree to negotiate in good faith toward a formal partnership agreement.

6. CONFIDENTIALITY
Both Parties agree to maintain the confidentiality of any proprietary or sensitive information shared during the course of this collaboration.

7. AMENDMENTS
This MOU may be amended only by a written instrument signed by authorized representatives of both Parties.

8. TERMINATION
Either Party may terminate this MOU upon thirty (30) days' written notice to the other Party.

9. GOVERNING LAW
This MOU shall be governed by the laws of ${f.jurisdiction}.

10. ENTIRE UNDERSTANDING
This MOU constitutes the entire understanding between the Parties with respect to its subject matter and supersedes all prior discussions, negotiations, and understandings.

IN WITNESS WHEREOF, the Parties have executed this Memorandum of Understanding as of the date first written above.

${f.partyA}                              ${f.partyB}

Signature: _______________________       Signature: _______________________

Name: ___________________________       Name: ___________________________

Title: ____________________________      Title: ____________________________

Date: ____________________________      Date: ____________________________`
}

export function generatePAText(f: PAFields): string {
  return `PARTNERSHIP AGREEMENT

This Partnership Agreement ("Agreement") is entered into as of ${f.effectiveDate} ("Effective Date") by and between:

${f.partyA} ("Partner A")

and

${f.partyB} ("Partner B")

collectively referred to as the "Partners."

1. SCOPE OF PARTNERSHIP
The Partners agree to collaborate on the following:

${f.scope}

2. REVENUE SHARING
The Parties agree to a revenue sharing arrangement as follows:
${f.revenueShare}

All revenue sharing calculations shall be made on net revenue after deduction of applicable taxes and third-party costs, unless otherwise agreed in writing.

3. TERM
This Agreement shall commence on the Effective Date and shall continue for a period of ${f.term}, unless earlier terminated in accordance with the terms herein.

4. TERMINATION
Either Party may terminate this Agreement by providing ${f.noticePeriod} written notice to the other Party. In the event of material breach, the non-breaching Party may terminate immediately upon written notice.

5. OBLIGATIONS OF PARTNER A
Partner A agrees to: (a) perform its obligations as set forth in the scope of partnership; (b) maintain open and transparent communication with Partner B; (c) promptly notify Partner B of any material changes that may affect the partnership.

6. OBLIGATIONS OF PARTNER B
Partner B agrees to: (a) perform its obligations as set forth in the scope of partnership; (b) maintain open and transparent communication with Partner A; (c) promptly notify Partner A of any material changes that may affect the partnership.

7. INTELLECTUAL PROPERTY
Each Party retains ownership of its pre-existing intellectual property. Any jointly developed intellectual property shall be owned equally by both Parties unless otherwise agreed in writing.

8. CONFIDENTIALITY
Each Party agrees to keep confidential all proprietary information of the other Party and not to disclose such information to any third party without prior written consent.

9. LIMITATION OF LIABILITY
Neither Party shall be liable for indirect, incidental, special, or consequential damages arising out of or related to this Agreement.

10. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of ${f.jurisdiction}.

11. DISPUTE RESOLUTION
Any disputes arising out of or in connection with this Agreement shall first be attempted to be resolved through good faith negotiation between the Parties. If unresolved, disputes shall be submitted to binding arbitration.

${f.additionalTerms ? `12. ADDITIONAL TERMS\n${f.additionalTerms}\n` : ''}
IN WITNESS WHEREOF, the Parties have executed this Partnership Agreement as of the Effective Date first written above.

${f.partyA}                              ${f.partyB}

Signature: _______________________       Signature: _______________________

Name: ___________________________       Name: ___________________________

Title: ____________________________      Title: ____________________________

Date: ____________________________      Date: ____________________________`
}
