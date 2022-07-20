def parseXML (xml):
    # print('xml', xml)
    txt = xml.strip()

    # remove opening xml tag
    if txt[0:5] == '<?xml':
        endXMLTag = txt.find('>')
        txt = txt[endXMLTag + 1:]

    elements = []

    while len(txt.strip()) > 0:
        [elementStr, _, txt] = txt.partition('>')
        
        [tag, _, elementStr] = elementStr.strip().partition(' ')
        tag = tag[1:] # remove '<'

        element = {
            'type': tag,
            'data': {},
            'children': []
        }

        end = ''
        if elementStr[-1] == '/':
            end = '/>'
            elementStr = elementStr.strip('/')
        else:
            end = '>'
        
        dataArr = elementStr.strip().split('\"')
        for i in range(len(dataArr) // 2): # interperate the element's keys and values
            j = i * 2
            key = dataArr[j].strip(' ').strip('=')
            value = dataArr[j + 1]
            value = value.strip('\"\'')
            element['data'][key] = value
        
        if (end != '/>'):
            [childText, _, txt] = txt.partition(f'</{tag}>')
            element['children'] = parseXML(childText)
        
        elements.append(element)
    
    return elements

