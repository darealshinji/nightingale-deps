/***************************************************************************
    copyright            : (C) 2002-2008 by Jochen Issing
    email                : jochen.issing@isign-softart.de
 ***************************************************************************/

/***************************************************************************
*   This library is free software; you can redistribute it and/or modify  *
*   it under the terms of the GNU Lesser General Public License version   *
*   2.1 as published by the Free Software Foundation.                     *
*                                                                         *
*   This library is distributed in the hope that it will be useful, but   *
*   WITHOUT ANY WARRANTY; without even the implied warranty of            *
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU     *
*   Lesser General Public License for more details.                       *
*                                                                         *
*   You should have received a copy of the GNU Lesser General Public      *
*   License along with this library; if not, write to the Free Software   *
*   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  *
*   USA                                                                   *
*                                                                         *
*   Alternatively, this file is available under the Mozilla Public        *
*   License Version 1.1.  You may obtain a copy of the License at         *
*   http://www.mozilla.org/MPL/                                           *
***************************************************************************/

#ifndef MP4METABOX_H
#define MP4METABOX_H

#include "mp4isofullbox.h"
#include "mp4containerbox.h"
#include "mp4fourcc.h"

namespace TagLib
{
  namespace MP4
  {
    class TAGLIB_EXPORT Mp4MetaBox: public Mp4IsoFullBox, public Mp4ContainerBox
    {
    public:
      Mp4MetaBox( TagLib::File* file, MP4::Fourcc fourcc, TagLib::uint size, long offset );
      ~Mp4MetaBox();

      //! parse meta contents
      void parse();

      //! find the next child box of the given fourcc
      //  returns null if not found
      //  @param offset Where to start searching (NULL to search from the start)
      virtual Mp4IsoBox* getChildBox( MP4::Fourcc fourcc, Mp4IsoBox* offset = NULL ) const;

    private:
      class Mp4MetaBoxPrivate;
      Mp4MetaBoxPrivate* d;
    }; // Mp4MetaBox

  } // namespace MP4
} // namespace TagLib

#endif // MP4METABOX_H
