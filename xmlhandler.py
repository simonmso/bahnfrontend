# ok I know it would have been way easier to use xml.etree.ElementTree but I wanted to try and write my own
# and now it works

def parseXML (xml):
    if len(xml) == 0: return []
    txt = xml.strip()

    # remove opening xml tag
    if txt[0:5] == '<?xml':
        endXMLTag = txt.find('>')
        txt = txt[endXMLTag + 1:]

    elements = []

    while len(txt.strip()) > 0:
        [elementStr, _, txt] = txt.partition('>')
        
        [tag, _, elementDataStr] = elementStr.strip().partition(' ')
        tag = tag[1:] # remove '<'

        element = {
            'type': tag,
            'data': {},
            'children': []
        }

        end = ''
        if len(elementDataStr) and elementDataStr[-1] == '/':
            end = '/>'
            elementDataStr = elementDataStr.strip('/')
        else:
            end = '>'
        
        dataArr = elementDataStr.strip().split('\"')
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

