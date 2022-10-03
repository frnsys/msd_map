import util from '@/util';
import * as React from 'react';

interface Props {
  loa: string,
  name: string,
  idLength: number,
  onSelect: (bbox: Bounds, place: string) => void,
}

const PlaceSelector = (props: Props) => {
  const onInput = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    let place = ev.target.value;
    if (place.length == props.idLength) {
      util.bboxForPlace(props.loa, place).then((bbox) => {
        if (!bbox) return;
        props.onSelect(bbox, place);
      });
    }
  }, []);

  return <div className="place-selector">
      <label>Jump to {props.name}</label>
      <input type="text" placeholder={props.name} onInput={onInput} />
  </div>
}

export default React.memo(PlaceSelector);
